import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { WorkflowsModule } from './workflows/workflows.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: '.env', isGlobal: true }),
    MongooseModule.forRoot(process.env.DATABASE_URL || 'mongodb://localhost/workflow-app'),
    WorkflowsModule,
  ],
  controllers: [AppController], // Remove WorkflowsController
  providers: [AppService], // Remove WorkflowsService
})
export class AppModule {}