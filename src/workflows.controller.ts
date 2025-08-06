import { Controller, Post, Body, Patch, Param, Delete, Get } from '@nestjs/common';
import { WorkflowsService } from './workflows.service';
import { CreateWorkflowDto } from './workflows/dtos/create-workflow.dto';
import { UpdateWorkflowDto } from './workflows/dtos/update-workflow.dto';

@Controller('workflows')
export class WorkflowsController {
  constructor(private readonly workflowsService: WorkflowsService) {}

  @Post()
  async create(@Body() createWorkflowDto: CreateWorkflowDto) {
    return this.workflowsService.create(createWorkflowDto);
  }

  @Patch(':name')
  async update(@Param('name') name: string, @Body() updateWorkflowDto: UpdateWorkflowDto) {
    return this.workflowsService.update(name, updateWorkflowDto);
  }

  @Delete(':name')
  async delete(@Param('name') name: string) {
    return this.workflowsService.delete(name);
  }

  @Get(':name/status')
  async getStatus(@Param('name') name: string) {
    return this.workflowsService.getStatus(name);
  }

  @Get()
  async getAllWorkflows() {
    return this.workflowsService.getAllWorkflows();
  }

  @Get(':name')
  async getWorkflow(@Param('name') name: string) {
    return this.workflowsService.getWorkflow(name);
  }

  @Patch(':name/step')
  async updateWorkflowStep(@Param('name') name: string, @Body('stepId') stepId: string) {
    return this.workflowsService.updateWorkflowStep(name, stepId);
  }

  @Post(':name/start')
  async start(@Param('name') name: string) {
    return this.workflowsService.startExecution(name);
  }

  @Post(':name/resume')
  async resume(@Param('name') name: string) {
    return this.workflowsService.resumeExecution(name);
  }

  @Get(':name/state')
  async state(@Param('name') name: string) {
    return this.workflowsService.getExecutionState(name);
  }

  @Delete(':name/stop')
  async stop(@Param('name') name: string) {
    return this.workflowsService.stopExecution(name);
  }
}