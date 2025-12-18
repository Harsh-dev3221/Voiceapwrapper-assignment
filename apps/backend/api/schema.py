import graphene
import core.schema
import organizations.schema
import projects.schema

class Query(
    core.schema.Query,
    organizations.schema.Query,
    projects.schema.Query,
    graphene.ObjectType
):
    pass

class Mutation(
    core.schema.Mutation,
    organizations.schema.Mutation,
    projects.schema.Mutation,
    graphene.ObjectType
):
    pass

schema = graphene.Schema(query=Query, mutation=Mutation)
