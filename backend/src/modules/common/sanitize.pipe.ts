import { Injectable, PipeTransform, ArgumentMetadata } from '@nestjs/common';
import { stripHTML } from './sanitize';

// Usage: @UsePipes(new SanitizePipe(['patient_name','patient_phone','reason']))
@Injectable()
export class SanitizePipe implements PipeTransform {
  constructor(private readonly fields: string[]) {}
  transform(value: any, _meta: ArgumentMetadata) {
    if (!value || typeof value !== 'object') return value;
    const out: any = { ...value };
    for (const f of this.fields) if (f in out && typeof out[f] === 'string') out[f] = stripHTML(out[f]);
    return out;
  }
}
