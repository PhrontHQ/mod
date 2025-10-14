# Authentication

Fundamental part of using end-mods, There has to be a section dedicted to Authenticating who is using it.

Authentication is provided by Organizations that offers an "IdentityProvider", typically an http endpoints implemnting an authentication protocol

## Consumer Authentication

EndMods aimed at consumers typically offer to reuse a user's existing identity from known IdentityProviders such as Google, Microsoft, Apple, Meta, etc... as well as creating a new, distinct user identity.

In this case, it's necessary to offer the user the list of Identity providers selected by the EndMod owner so they can chose the one they want.

As each Identity Providers to be used require the instanciation and configuration of a RawDataService for each, doing a query like:

        let identityProvidingOrganizationCriteria = new Criteria().initWithExpression("identityProfiders !== null"),
            identityProvidingOrganizationQuery = DataQuery.withTypeAndCriteria(Organization, identityProvidingOrganizationCriteria),
            identityProvidingOrganizationDataStream = DataService.mainService.fetchData(identityProvidingOrganizationQuery);


Which should return a list of Organization. Once the user selects an Organization, then:

        let userIdentityCriteria = new Criteria().initWithExpression("identityProvider.ownerOrganization == $", userChosenComppanyProvidingUserIdentity),
            identityQuery = DataQuery.withTypeAndCriteria(UserIdentity, userIdentityCriteria),
            userIdentityQueryDataStream = DataService.mainService.fetchData(userIdentityQuery);


We need a section that represents Authentication from a data model stand point.


## Enterprise Authentication

Some IdentityProvider sell their services to other companies, in which case they are multi-tenant. So ultimately one of those companies is a tenant on that platform, which is a service Azure and GCP both offer.

So when we fetch a UserIdentity to know who's using the end-mod, and we know it's an enterprise end-mod, it would make sense to endup with a criteria like:

        let userIdentityCriteria = new Criteria().initWithExpression("tenant == $", companyOwningTheCurrentEndMod),
            identityQuery = DataQuery.withTypeAndCriteria(UserIdentity, userIdentityCriteria),
            identityQueryDataStream = DataService.mainService.fetchData(identityQuery);

IdentityDataServices would have to be configured to know that have that tenant



