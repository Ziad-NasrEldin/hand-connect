import { z } from 'zod';
import { isValidEgyptPhone } from './phone';

export const egyptPhoneSchema = z.string().refine(isValidEgyptPhone, 'validation.phone');
export const requiredText = z.string().min(2, 'validation.required');
