import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { CHAIN_VALUES } from '../../prisma-enums';

@ValidatorConstraint({ name: 'IsChain', async: false })
class IsChainConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return typeof value === 'string' && (CHAIN_VALUES as readonly string[]).includes(value);
  }
  defaultMessage(): string {
    return `chain must be one of: ${CHAIN_VALUES.join(', ')}`;
  }
}

export function IsChain(options?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options,
      validator: IsChainConstraint,
    });
  };
}
