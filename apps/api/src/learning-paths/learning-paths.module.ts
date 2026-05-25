import { Module } from '@nestjs/common';
import { LearningPathsController } from './learning-paths.controller';
import { LearningPathsService } from './learning-paths.service';
import { RagModule } from '../rag/rag.module';

@Module({
  imports: [RagModule],
  controllers: [LearningPathsController],
  providers: [LearningPathsService],
})
export class LearningPathsModule {}
