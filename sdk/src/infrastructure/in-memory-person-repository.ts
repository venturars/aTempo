import type { Email } from '../domain/email'
import type { IdentificationDocument } from '../domain/identifier'
import { Organization } from '../domain/organization'
import { Person, OrganizationPerson } from '../domain/person'
import { PersonRecord } from '../domain/person-record'
import { PersonRole } from '../domain/person-role'
import { PersonRepository } from '../domain/person-repository'
import type { Uuid } from '../domain/scalars'

export class InMemoryPersonRepository implements PersonRepository {
  private readonly records = new Map<string, PersonRecord>()
  private readonly rolesByPerson = new Map<string, PersonRole[]>()
  private readonly byEmail = new Map<string, string>()
  private readonly byDocument = new Map<string, string>()
  private readonly organizations = new Map<string, Organization>()
  private readonly byTaxId = new Map<string, string>()

  constructor(people: OrganizationPerson[] = [], organizations: Organization[] = []) {
    for (const organization of organizations) {
      this.indexOrganization(organization)
    }
    for (const person of people) {
      this.save(person)
    }
  }

  add(person: OrganizationPerson): void {
    void this.save(person)
  }

  size(): number {
    return this.records.size
  }

  async findByEmail(email: Email): Promise<Person | null> {
    const id = this.byEmail.get(email)
    return id ? this.loadPerson(id) : null
  }

  async findById(personId: Uuid): Promise<Person | null> {
    return this.loadPerson(personId)
  }

  async findByIdentificationDocument(
    document: IdentificationDocument,
  ): Promise<Person | null> {
    const id = this.byDocument.get(document)
    return id ? this.loadPerson(id) : null
  }

  async listByOrganization(organizationId: Uuid): Promise<Person[]> {
    return [...this.records.values()]
      .filter((record) => record.organizationId === organizationId)
      .map((record) => this.composePerson(record))
  }

  async save(person: OrganizationPerson): Promise<void> {
    const { roles, ...record } = person
    const previous = this.records.get(person.id)
    if (previous) {
      this.byEmail.delete(previous.email)
      this.byDocument.delete(previous.identificationDocument)
    }
    this.records.set(person.id, record)
    this.rolesByPerson.set(person.id, [...roles])
    this.byEmail.set(record.email, record.id)
    this.byDocument.set(record.identificationDocument, record.id)
  }

  async delete(personId: Uuid): Promise<void> {
    const previous = this.records.get(personId)
    if (!previous) return
    this.records.delete(personId)
    this.rolesByPerson.delete(personId)
    this.byEmail.delete(previous.email)
    this.byDocument.delete(previous.identificationDocument)
  }

  async findOrganizationById(organizationId: Uuid): Promise<Organization | null> {
    return this.organizations.get(organizationId) ?? null
  }

  async findByTaxId(taxId: Organization['taxId']): Promise<Organization | null> {
    const id = this.byTaxId.get(taxId)
    return id ? (this.organizations.get(id) ?? null) : null
  }

  async saveOrganization(organization: Organization): Promise<void> {
    const previous = this.organizations.get(organization.id)
    if (previous) {
      this.byTaxId.delete(previous.taxId)
    }
    this.indexOrganization(organization)
  }

  private loadPerson(personId: string): Person | null {
    const record = this.records.get(personId)
    return record ? this.composePerson(record) : null
  }

  private composePerson(record: PersonRecord): Person {
    return {
      ...record,
      roles: this.rolesByPerson.get(record.id) ?? [],
    }
  }

  private indexOrganization(organization: Organization): void {
    this.organizations.set(organization.id, organization)
    this.byTaxId.set(organization.taxId, organization.id)
  }
}