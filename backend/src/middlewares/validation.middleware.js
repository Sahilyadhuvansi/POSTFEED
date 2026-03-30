"use strict";

const { z } = require("zod");
const ErrorResponse = require("../utils/ErrorResponse");

/**
 * Zod Request Validation Middleware
 * @param {z.ZodSchema} schema - The validation schema for req.body
 */
const validate = (schema) => (req, _res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    const message = error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
    next(new ErrorResponse(message, 400, "VALIDATION_ERROR", error.errors));
  }
};

// Example Schemas
const loginSchema = z.object({
  email: z.string().email().optional(),
  username: z.string().min(3).optional(),
  password: z.string().min(6),
}).refine(data => data.email || data.username, {
  message: "Either email or username is required",
  path: ["email", "username"]
});

const registerSchema = z.object({
  username: z.string().min(3).max(30),
  email: z.string().email(),
  password: z.string().min(8).regex(/[A-Z]/, "Must contain an uppercase letter"),
});

module.exports = {
  validate,
  schemas: {
    loginSchema,
    registerSchema
  }
};
