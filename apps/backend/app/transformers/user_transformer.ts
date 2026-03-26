import type User from '#models/user'
import type Employee from '#models/employee'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class UserTransformer extends BaseTransformer<User | Employee> {
  toObject() {
    return this.pick(this.resource as any, [
      'id',
      'fullName',
      'email',
      'createdAt',
      'updatedAt',
      'initials',
    ])
  }
}
