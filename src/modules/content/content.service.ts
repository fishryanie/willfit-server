import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { MODEL_NAMES } from 'modules/database/model-registry'
import { CrudService, type CrudListQuery } from 'modules/shared/crud.service'
import type { Model } from 'mongoose'

const resourceKeys = ['plan', 'states', 'schedule', 'guide', 'news', 'course', 'article-categories', 'article', 'contact'] as const

export type ContentResource = (typeof resourceKeys)[number]

@Injectable()
export class ContentService {
  constructor(
    @Inject(CrudService) private readonly crud: CrudService,
    @InjectModel(MODEL_NAMES.plan) private readonly planModel: Model<any>,
    @InjectModel(MODEL_NAMES.states) private readonly statesModel: Model<IDefinitionCommon>,
    @InjectModel(MODEL_NAMES.schedule) private readonly scheduleModel: Model<IDefinitionCommon>,
    @InjectModel(MODEL_NAMES.guide) private readonly guideModel: Model<IDefinitionCommon>,
    @InjectModel(MODEL_NAMES.news) private readonly newsModel: Model<IDefinitionCommon>,
    @InjectModel(MODEL_NAMES.course) private readonly courseModel: Model<IDefinitionCommon>,
    @InjectModel(MODEL_NAMES.articleCategory) private readonly articleCategoriesModel: Model<IDefinitionCommon>,
    @InjectModel(MODEL_NAMES.article) private readonly articleModel: Model<any>,
    @InjectModel(MODEL_NAMES.contact) private readonly contactModel: Model<IContact>
  ) {}

  private model(resource: ContentResource) {
    const model = {
      plan: this.planModel,
      states: this.statesModel,
      schedule: this.scheduleModel,
      guide: this.guideModel,
      news: this.newsModel,
      course: this.courseModel,
      'article-categories': this.articleCategoriesModel,
      article: this.articleModel,
      contact: this.contactModel
    }[resource]
    if (!model) throw new NotFoundException('Content resource not found')
    return model
  }

  private options(resource: ContentResource) {
    return {
      populate: resource === 'article' ? [{ path: 'category', select: '-__v' }] : undefined,
      searchFields: ['name', 'description', 'content', 'email', 'phone']
    }
  }

  list(resource: ContentResource, query: CrudListQuery) {
    return this.crud.list(this.model(resource), query, this.options(resource))
  }
  get(resource: ContentResource, id: string, includeDeleted?: boolean) {
    return this.crud.getById(this.model(resource), id, this.options(resource), includeDeleted)
  }
  create(resource: ContentResource, body: Record<string, unknown>) {
    return this.crud.create(this.model(resource), body)
  }
  update(resource: ContentResource, id: string, body: Record<string, unknown>, replace = false) {
    return this.crud.update(this.model(resource), id, body, replace)
  }
  delete(resource: ContentResource, id: string) {
    return this.crud.softDelete(this.model(resource), id)
  }
  restore(resource: ContentResource, id: string) {
    return this.crud.restore(this.model(resource), id)
  }
}
