import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type WorkflowDocument = Workflow & Document;

@Schema({ timestamps: true })
export class Workflow {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true })
  filePath: string;

  @Prop({ default: 'created' })
  status: string;

  @Prop({ default: null })
  currentStep: string | null; // Tracks the current step ID or name (e.g., "StartEvent_1")
  
  // Explicitly declare timestamps fields
  createdAt: Date;

  updatedAt: Date;
}

export const WorkflowSchema = SchemaFactory.createForClass(Workflow);