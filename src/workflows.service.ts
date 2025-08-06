import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateWorkflowDto } from './workflows/dtos/create-workflow.dto';
import { UpdateWorkflowDto } from './workflows/dtos/update-workflow.dto';
import { Workflow, WorkflowDocument } from './workflows/schemas/workflow.schema';
import * as fs from 'fs';
import * as path from 'path';
const BpmnModdle = require('bpmn-moddle');
import { WorkflowJS } from '@vhidvz/wfjs';

interface WorkflowInstance {
  engine: ReturnType<typeof WorkflowJS.build>;
  context: any;
}

const workflowInstances = new Map<string, WorkflowInstance>();

@Injectable()
export class WorkflowsService {
  private baseDir = path.join(process.cwd(), 'bpmn');

  constructor(
    @InjectModel(Workflow.name) private workflowModel: Model<WorkflowDocument>,
  ) {
    if (!fs.existsSync(this.baseDir)) fs.mkdirSync(this.baseDir);
  }

  async create(dto: CreateWorkflowDto) {
    const moddle = new BpmnModdle();

    const definitions = moddle.create('bpmn:Definitions', {
      id: dto.json.id || 'Definitions_' + Date.now(),
      targetNamespace: 'http://bpmn.io/schema/bpmn',
      xmlns: 'http://www.omg.org/spec/BPMN/20100524/MODEL',
      'xmlns:bpmndi': 'http://www.omg.org/spec/BPMN/20100524/DI',
      'xmlns:dc': 'http://www.omg.org/spec/DD/20100524/DC',
      'xmlns:di': 'http://www.omg.org/spec/DD/20100524/DI',
    });

    const process = moddle.create('bpmn:Process', {
      id: dto.json.rootElements[0]?.id || 'Process_' + Date.now(),
      isExecutable: true,
    });

    // Explicitly type flowElements to avoid 'never' issue
    const flowElements: any[] = [];
    const startEvent = moddle.create('bpmn:StartEvent', { id: 'StartEvent_1', name: 'Start' });
    const task = moddle.create('bpmn:Task', { id: 'Task_1', name: 'Sample Task' });
    const endEvent = moddle.create('bpmn:EndEvent', { id: 'EndEvent_1', name: 'End' });
    const sequenceFlow1 = moddle.create('bpmn:SequenceFlow', {
      id: 'Flow_1',
      sourceRef: startEvent,
      targetRef: task,
    });
    const sequenceFlow2 = moddle.create('bpmn:SequenceFlow', {
      id: 'Flow_2',
      sourceRef: task,
      targetRef: endEvent,
    });

    flowElements.push(startEvent, task, endEvent, sequenceFlow1, sequenceFlow2);

    // Include user-provided flow elements only if they form a valid linear extension
    if (dto.json.rootElements[0]?.flowElements?.length) {
      const userElements = dto.json.rootElements[0].flowElements
        .filter((element) => !['Flow_1', 'Flow_2', 'StartEvent_1', 'Task_1', 'EndEvent_1'].includes(element.id))
        .map((element) => {
          if (element.$type === 'bpmn:SequenceFlow') {
            return moddle.create('bpmn:SequenceFlow', {
              id: element.id,
              name: element.name || element.id,
              sourceRef: flowElements.find((el) => el.id === element.sourceRef) || moddle.create('bpmn:Task', { id: element.sourceRef }),
              targetRef: flowElements.find((el) => el.id === element.targetRef) || moddle.create('bpmn:Task', { id: element.targetRef }),
            });
          }
          return moddle.create(element.$type, {
            id: element.id,
            name: element.name || element.id,
          });
        });

      // Ensure strictly linear flow: StartEvent_1 -> Task_1 -> UserTask_1 -> EndEvent_1
      if (userElements.length) {
        const lastTask = moddle.create('bpmn:Task', { id: 'UserTask_1', name: 'User Task' });
        const lastFlow = moddle.create('bpmn:SequenceFlow', {
          id: 'UserFlow_1',
          sourceRef: task,
          targetRef: lastTask,
        });
        const finalFlow = moddle.create('bpmn:SequenceFlow', {
          id: 'UserFlow_2',
          sourceRef: lastTask,
          targetRef: endEvent,
        });

        flowElements.splice(flowElements.indexOf(sequenceFlow2), 1); // Remove original Flow_2
        flowElements.push(lastTask, lastFlow, finalFlow);
      }
    }

    process.flowElements = flowElements;
    definitions.rootElements = [process];

    // Generate and validate XML
    let xml: string;
    try {
      const result = await moddle.toXML(definitions, { format: true });
      if (typeof result.xml !== 'string') {
        throw new Error('moddle.toXML did not return a valid XML string');
      }
      xml = result.xml;
      console.log('Generated BPMN XML:', xml); // Debug the XML

      // Validate XML
      const parsed = await moddle.fromXML(xml);
      console.log('Validated BPMN model:', JSON.stringify(parsed.rootElement, null, 2)); // Debug parsed model
    } catch (error) {
      console.error('Invalid BPMN XML:', error);
      throw new Error(`Failed to validate BPMN XML: ${error.message}`);
    }

    const filePath = path.join(this.baseDir, `${dto.name}.bpmn`);
    fs.writeFileSync(filePath, xml);

    const workflow = new this.workflowModel({
      name: dto.name,
      filePath,
      status: 'created',
      currentStep: 'StartEvent_1',
    });
    await workflow.save();

    return { message: 'Workflow created', name: dto.name };
  }

  async update(name: string, dto: UpdateWorkflowDto) {
    const filePath = path.join(this.baseDir, `${name}.bpmn`);
    if (!fs.existsSync(filePath)) throw new Error('Workflow not found');

    const workflow = await this.workflowModel.findOne({ name });
    if (!workflow) throw new Error('Workflow not found in database');

    const moddle = new BpmnModdle();

    const definitions = moddle.create('bpmn:Definitions', {
      id: dto.json.id || 'Definitions_' + Date.now(),
      targetNamespace: 'http://bpmn.io/schema/bpmn',
      xmlns: 'http://www.omg.org/spec/BPMN/20100524/MODEL',
      'xmlns:bpmndi': 'http://www.omg.org/spec/BPMN/20100524/DI',
      'xmlns:dc': 'http://www.omg.org/spec/DD/20100524/DC',
      'xmlns:di': 'http://www.omg.org/spec/DD/20100524/DI',
    });

    const process = moddle.create('bpmn:Process', {
      id: dto.json.rootElements[0]?.id || 'Process_' + Date.now(),
      isExecutable: true,
    });

    // Explicitly type flowElements to avoid 'never' issue
    const flowElements: any[] = [];
    const startEvent = moddle.create('bpmn:StartEvent', { id: 'StartEvent_1', name: 'Start' });
    const task = moddle.create('bpmn:Task', { id: 'Task_1', name: 'Sample Task' });
    const endEvent = moddle.create('bpmn:EndEvent', { id: 'EndEvent_1', name: 'End' });
    const sequenceFlow1 = moddle.create('bpmn:SequenceFlow', {
      id: 'Flow_1',
      sourceRef: startEvent,
      targetRef: task,
    });
    const sequenceFlow2 = moddle.create('bpmn:SequenceFlow', {
      id: 'Flow_2',
      sourceRef: task,
      targetRef: endEvent,
    });

    flowElements.push(startEvent, task, endEvent, sequenceFlow1, sequenceFlow2);

    // Include user-provided flow elements only if they form a valid linear extension
    if (dto.json.rootElements[0]?.flowElements?.length) {
      const userElements = dto.json.rootElements[0].flowElements
        .filter((element) => !['Flow_1', 'Flow_2', 'StartEvent_1', 'Task_1', 'EndEvent_1'].includes(element.id))
        .map((element) => {
          if (element.$type === 'bpmn:SequenceFlow') {
            return moddle.create('bpmn:SequenceFlow', {
              id: element.id,
              name: element.name || element.id,
              sourceRef: flowElements.find((el) => el.id === element.sourceRef) || moddle.create('bpmn:Task', { id: element.sourceRef }),
              targetRef: flowElements.find((el) => el.id === element.targetRef) || moddle.create('bpmn:Task', { id: element.targetRef }),
            });
          }
          return moddle.create(element.$type, {
            id: element.id,
            name: element.name || element.id,
          });
        });

      // Ensure strictly linear flow
      if (userElements.length) {
        const lastTask = moddle.create('bpmn:Task', { id: 'UserTask_1', name: 'User Task' });
        const lastFlow = moddle.create('bpmn:SequenceFlow', {
          id: 'UserFlow_1',
          sourceRef: task,
          targetRef: lastTask,
        });
        const finalFlow = moddle.create('bpmn:SequenceFlow', {
          id: 'UserFlow_2',
          sourceRef: lastTask,
          targetRef: endEvent,
        });

        flowElements.splice(flowElements.indexOf(sequenceFlow2), 1); // Remove original Flow_2
        flowElements.push(lastTask, lastFlow, finalFlow);
      }
    }

    process.flowElements = flowElements;
    definitions.rootElements = [process];

    // Generate and validate XML
    let xml: string;
    try {
      const result = await moddle.toXML(definitions, { format: true });
      if (typeof result.xml !== 'string') {
        throw new Error('moddle.toXML did not return a valid XML string');
      }
      xml = result.xml;
      console.log('Updated BPMN XML:', xml); // Debug the XML

      // Validate XML
      const parsed = await moddle.fromXML(xml);
      console.log('Validated BPMN model:', JSON.stringify(parsed.rootElement, null, 2)); // Debug parsed model
    } catch (error) {
      console.error('Invalid BPMN XML:', error);
      throw new Error(`Failed to validate BPMN XML: ${error.message}`);
    }

    fs.writeFileSync(filePath, xml);

    workflow.status = 'updated';
    workflow.currentStep = 'StartEvent_1';
    await workflow.save();

    return { message: 'Workflow updated', name };
  }

  async delete(name: string) {
    const filePath = path.join(this.baseDir, `${name}.bpmn`);
    if (!fs.existsSync(filePath)) throw new Error('Workflow not found');

    const workflow = await this.workflowModel.findOne({ name });
    if (!workflow) throw new Error('Workflow not found in database');

    fs.unlinkSync(filePath);
    workflow.status = 'deleted';
    workflow.currentStep = null;
    await workflow.save();

    return { message: 'Workflow deleted', name };
  }

  async getStatus(name: string) {
    const workflow = await this.workflowModel.findOne({ name });
    if (!workflow) throw new Error('Workflow not found in database');

    return {
      name: workflow.name,
      status: workflow.status,
      currentStep: workflow.currentStep,
      createdAt: workflow.createdAt,
      updatedAt: workflow.updatedAt,
    };
  }

  async getAllWorkflows() {
    const workflows = await this.workflowModel.find().exec();
    return workflows.map((workflow) => ({
      name: workflow.name,
      status: workflow.status,
      currentStep: workflow.currentStep,
      createdAt: workflow.createdAt,
      updatedAt: workflow.updatedAt,
    }));
  }

  async getWorkflow(name: string) {
    const workflow = await this.workflowModel.findOne({ name });
    if (!workflow) throw new Error('Workflow not found in database');

    const filePath = workflow.filePath;
    if (!fs.existsSync(filePath)) throw new Error('BPMN file not found');

    const xml = fs.readFileSync(filePath, 'utf-8');
    return {
      name: workflow.name,
      status: workflow.status,
      currentStep: workflow.currentStep,
      bpmnXml: xml,
      createdAt: workflow.createdAt,
      updatedAt: workflow.updatedAt,
    };
  }

  async updateWorkflowStep(name: string, stepId: string) {
    const workflow = await this.workflowModel.findOne({ name });
    if (!workflow) throw new Error('Workflow not found in database');

    const filePath = workflow.filePath;
    if (!fs.existsSync(filePath)) throw new Error('BPMN file not found');

    const xml = fs.readFileSync(filePath, 'utf-8');
    const moddle = new BpmnModdle();
    const { rootElement: definitions } = await moddle.fromXML(xml);
    const process = definitions.rootElements.find((el: any) => el.$type === 'bpmn:Process');
    const flowElements = process?.flowElements || [];
    const stepExists = flowElements.some((el: any) => el.id === stepId);

    if (!stepExists) throw new Error(`Step ${stepId} not found in workflow`);

    workflow.currentStep = stepId;
    await workflow.save();

    return {
      name: workflow.name,
      status: workflow.status,
      currentStep: workflow.currentStep,
      createdAt: workflow.createdAt,
      updatedAt: workflow.updatedAt,
    };
  }

  async startExecution(name: string) {
    const bpmnPath = path.join(this.baseDir, `${name}.bpmn`);
    if (!fs.existsSync(bpmnPath)) throw new Error('Workflow file not found');

    const xml = fs.readFileSync(bpmnPath, 'utf-8');
    console.log('BPMN XML for execution:', xml); // Debug the XML

    // Validate and parse XML
    const moddle = new BpmnModdle();
    let parsedModel;
    try {
      const result = await moddle.fromXML(xml);
      parsedModel = result.rootElement;
      console.log('Parsed BPMN model:', JSON.stringify(parsedModel, null, 2)); // Debug the parsed model
    } catch (error) {
      console.error('Invalid BPMN XML for execution:', error);
      throw new Error(`Failed to validate BPMN XML: ${error.message}`);
    }

    const engine = WorkflowJS.build();

    try {
      // Try passing parsed model instead of XML
      const exec = await engine.execute({
        xml, // Fallback to XML if parsed model fails
        // definitions: parsedModel, // Uncomment if WorkflowJS supports parsed model
        factory: () => ({
          async task(node, token) {
            console.log(`▶️ Running task: ${node.id}`);
            await new Promise((res) => setTimeout(res, 500));
            token.complete();
          },
          async startEvent(node, token) {
            console.log(`▶️ Starting process: ${node.id}`);
            token.complete();
          },
          async endEvent(node, token) {
            console.log(`▶️ Ending process: ${node.id}`);
            token.complete();
          },
          async sequenceFlow(node, token) {
            console.log(`▶️ Processing sequence flow: ${node.id}`);
            token.complete();
          },
        }),
      });

      workflowInstances.set(name, {
        engine,
        context: exec.context,
      });

      return { message: `Workflow ${name} started` };
    } catch (error) {
      console.error('Error executing workflow:', error);
      throw new Error(`Failed to execute workflow: ${error.message}`);
    }
  }

  async getExecutionState(name: string) {
    const instance = workflowInstances.get(name);
    if (!instance) throw new Error('Workflow not running');

    const state = instance.context.serialize();

    return {
      name,
      status: state.status,
      currentStep: state.current?.id,
      data: state.data,
      tokens: state.tokens,
    };
  }

  async stopExecution(name: string) {
    const instance = workflowInstances.get(name);
    if (!instance) throw new Error('Workflow not running');

    await instance.context.terminate();
    workflowInstances.delete(name);
    return { message: `Workflow ${name} stopped and removed from memory` };
  }

  async resumeExecution(name: string) {
    const instance = workflowInstances.get(name);
    if (!instance) throw new Error('Workflow not running or not paused');

    await instance.context.resume();
    return { message: `Workflow ${name} resumed` };
  }
}