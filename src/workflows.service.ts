import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateWorkflowDto } from './workflows/dtos/create-workflow.dto';
import { UpdateWorkflowDto } from './workflows/dtos/update-workflow.dto';
import { Workflow, WorkflowDocument } from './workflows/schemas/workflow.schema';
import * as fs from 'fs';
import * as path from 'path';
const BpmnModdle = require('bpmn-moddle');

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
    console.log('🧾 Received JSON:', JSON.stringify(dto.json, null, 2));

    try {
      const definitions = moddle.create('bpmn:Definitions', {
        id: dto.json.id || 'Definitions_1',
        targetNamespace: dto.json.targetNamespace || 'http://bpmn.io/schema/bpmn',
      });

      const process = moddle.create('bpmn:Process', {
        id: dto.json.rootElements[0]?.id || 'Process_1',
        isExecutable: dto.json.rootElements[0]?.isExecutable ?? true,
      });

      const flowElements = (dto.json.rootElements[0]?.flowElements || []).map(
        (element: any) => moddle.create(element.$type, { id: element.id }),
      );
      process.flowElements = flowElements;
      definitions.rootElements = [process];

      const { xml } = await moddle.toXML(definitions);

      const filePath = path.join(this.baseDir, `${dto.name}.bpmn`);
      fs.writeFileSync(filePath, xml);

      const workflow = new this.workflowModel({
        name: dto.name,
        filePath,
        status: 'created',
        currentStep: flowElements.length > 0 ? flowElements[0].id : null, // Start at the first step
      });
      await workflow.save();

      return { message: 'Workflow created', name: dto.name };
    } catch (err) {
      console.error('🔥 Error converting BPMN:', err);
      throw new Error('Failed to create BPMN XML: ' + err.message);
    }
  }

  async update(name: string, dto: UpdateWorkflowDto) {
    const filePath = path.join(this.baseDir, `${name}.bpmn`);
    if (!fs.existsSync(filePath)) throw new Error('Workflow not found');

    const workflow = await this.workflowModel.findOne({ name });
    if (!workflow) throw new Error('Workflow not found in database');

    const moddle = new BpmnModdle();
    try {
      const definitions = moddle.create('bpmn:Definitions', {
        id: dto.json.id || 'Definitions_1',
        targetNamespace: dto.json.targetNamespace || 'http://bpmn.io/schema/bpmn',
      });

      const process = moddle.create('bpmn:Process', {
        id: dto.json.rootElements[0]?.id || 'Process_1',
        isExecutable: dto.json.rootElements[0]?.isExecutable ?? true,
      });

      const flowElements = (dto.json.rootElements[0]?.flowElements || []).map(
        (element: any) => moddle.create(element.$type, { id: element.id }),
      );
      process.flowElements = flowElements;
      definitions.rootElements = [process];

      const { xml } = await moddle.toXML(definitions);

      fs.writeFileSync(filePath, xml);

      workflow.status = 'updated';
      workflow.currentStep = flowElements.length > 0 ? flowElements[0].id : null; // Reset to first step
      await workflow.save();

      return { message: 'Workflow updated', name };
    } catch (err) {
      console.error('🔥 Error updating BPMN:', err);
      throw new Error('Failed to update BPMN XML: ' + err.message);
    }
  }

  async delete(name: string) {
    const filePath = path.join(this.baseDir, `${name}.bpmn`);
    if (!fs.existsSync(filePath)) throw new Error('Workflow not found');

    const workflow = await this.workflowModel.findOne({ name });
    if (!workflow) throw new Error('Workflow not found in database');

    fs.unlinkSync(filePath);
    workflow.status = 'deleted';
    workflow.currentStep = null; // Clear current step
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

    // Validate stepId exists in the BPMN process
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
}