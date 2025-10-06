var Organization = require("./organization").Organization;

/**
 * @class RegisteredOrganization
 * @extends Organization
 */


 /*

#### **4. `RegisteredOrganization` (Subclass of `Organization`)**
- **Purpose:** Represents **any organization formally recorded with a government or legal authority**.
- **Attributes:**
  - `registeringAuthority: String` (e.g., "State of California")
  - `legalStatus: Enum` (e.g., `Incorporated`, `RegisteredPartnership`, `GovernmentAgency`)
  - `complianceRequirements: List<String>` (e.g., annual filings, audits)
- **Subclasses:**
  - **`IncorporatedOrganization`:** For entities with **limited liability** and **separate legal personality** (e.g., corporations, LLCs).
  - **`GovernmentAgency`:** Public-sector entities with **legal authority** but not "incorporated" in the private sense.
  - **`RegisteredPartnership`:** Partnerships that are formally registered (e.g., limited partnerships).
  - **`RegisteredTrust`/`RegisteredAssociation`:** Other formally registered entities.
 */


exports.RegisteredOrganization = Organization.specialize(/** @lends RegisteredOrganization.prototype */ {
    constructor: {
        value: function RegisteredOrganization() {
            this.super();
            return this;
        }
    },
    registrantOrganizationRegistrations: {
        value: undefined
    },
    registrarOrganizationRegistrations: {
        value: undefined
    }

});
