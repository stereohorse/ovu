import { z } from "zod";

import { taskPriorities } from "../contracts.js";
import { protectedProcedure, router } from "../core.js";

const taskIdSchema = z.object({
  taskId: z.string().min(1),
});

export const taskRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().trim().min(1).max(160),
        description: z.string().trim().min(1).max(8_000),
        priority: z.enum(taskPriorities),
      }),
    )
    .mutation(({ ctx, input }) => {
      return ctx.createTask(input);
    }),
  get: protectedProcedure.input(taskIdSchema).query(({ ctx, input }) => {
    return ctx.loadTask(input.taskId);
  }),
  update: protectedProcedure
    .input(
      z.object({
        taskId: z.string().min(1),
        title: z.string().trim().min(1).max(160),
        description: z.string().trim().min(1).max(8_000),
        priority: z.enum(taskPriorities),
      }),
    )
    .mutation(({ ctx, input }) => {
      return ctx.updateTask(input);
    }),
  addAcceptanceCriterion: protectedProcedure
    .input(
      z.object({
        taskId: z.string().min(1),
        text: z.string().trim().min(1).max(500),
      }),
    )
    .mutation(({ ctx, input }) => {
      return ctx.addAcceptanceCriterion(input);
    }),
  updateAcceptanceCriterion: protectedProcedure
    .input(
      z.object({
        taskId: z.string().min(1),
        criterionId: z.string().min(1),
        text: z.string().trim().min(1).max(500),
      }),
    )
    .mutation(({ ctx, input }) => {
      return ctx.updateAcceptanceCriterion(input);
    }),
  deleteAcceptanceCriterion: protectedProcedure
    .input(
      z.object({
        taskId: z.string().min(1),
        criterionId: z.string().min(1),
      }),
    )
    .mutation(({ ctx, input }) => {
      ctx.deleteAcceptanceCriterion(input);
      return { success: true };
    }),
  reorderAcceptanceCriteria: protectedProcedure
    .input(
      z.object({
        taskId: z.string().min(1),
        orderedCriterionIds: z.array(z.string().min(1)).min(1),
      }),
    )
    .mutation(({ ctx, input }) => {
      return ctx.reorderAcceptanceCriteria(input);
    }),
  listComments: protectedProcedure
    .input(taskIdSchema)
    .query(({ ctx, input }) => {
      return ctx.loadTaskComments(input.taskId);
    }),
  addComment: protectedProcedure
    .input(
      z.object({
        taskId: z.string().min(1),
        body: z.string().trim().min(1).max(2_000),
      }),
    )
    .mutation(({ ctx, input }) => {
      return ctx.addComment(input);
    }),
  addReply: protectedProcedure
    .input(
      z.object({
        taskId: z.string().min(1),
        parentCommentId: z.string().min(1),
        body: z.string().trim().min(1).max(2_000),
      }),
    )
    .mutation(({ ctx, input }) => {
      return ctx.addReply(input);
    }),
});
