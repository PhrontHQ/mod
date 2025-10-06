var RegisteredOrganization = require("./registered-organization").RegisteredOrganization;

/**
 * @class IncorporatedOrganization
 * @extends RegisteredOrganization
 * 
 * 
 * 
 */

/*

Creating an **`IncorporatedOrganization` as a subclass of `RegisteredOrganization`**) adds significant **clarity, precision, and functional value** to your hierarchy, especially for systems that need to model legal, financial, or operational distinctions between different types of organizations. Here’s why this specialization is valuable:

---

## **1. Legal and Structural Clarity**
### **Distinguishing Limited Liability**
- **`IncorporatedOrganization`** explicitly represents entities with **limited liability** (e.g., corporations, LLCs).
  - This is critical for legal and financial systems, where liability protection is a **fundamental distinction**.
  - Example: A `Corporation` (subclass of `IncorporatedOrganization`) shields its shareholders from personal liability for business debts.

### **Separate Legal Personality**
- Incorporated entities are **separate legal persons** in the eyes of the law. This means:
  - They can **own property**, **enter contracts**, and **sue/be sued** independently of their owners.
  - This is not true for all `RegisteredOrganization` types (e.g., a registered partnership may not have separate legal personality).

---

## **2. Attribute and Behavioral Precision**
### **Specialized Attributes**
- **`IncorporatedOrganization`** can include **attributes specific to incorporated entities**:
  - `articlesOfIncorporation: File`
  - `shareholders: List<Person>`
  - `boardOfDirectors: List<Person>`
  - `corporateBylaws: File`
  - `stockIssued: Boolean`
  - `dividendPolicy: String`

- These attributes **do not apply** to other `RegisteredOrganization` types (e.g., government agencies or registered trusts).

### **Specialized Methods**
- **`IncorporatedOrganization`** can define **methods unique to incorporated entities**:
  - `issueShares(to: Person, amount: Integer)`
  - `holdBoardMeeting(minutes: File)`
  - `fileAnnualReport()`
  - `declareDividends(amount: Float)`

- These methods are **irrelevant** for unincorporated or non-corporate registered entities.

---

## **3. Tax and Compliance Modeling**
### **Tax Treatment**
- Incorporated entities often have **unique tax rules**:
  - Corporations may face **double taxation** (corporate tax + dividend tax).
  - LLCs may have **pass-through taxation** but with formal filing requirements.
- Modeling this as a subclass allows you to **encapsulate tax logic** specific to incorporated entities.

### **Regulatory Compliance**
- Incorporated entities are subject to **specific compliance requirements**:
  - Annual reports, shareholder meetings, audits, and regulatory filings.
  - Example: A `Corporation` must file **Form 10-K** (U.S.) or equivalent documents.
- These requirements **do not apply** to unincorporated or non-corporate registered entities.

---

## **4. Relationship Modeling**
### **Ownership and Governance**
- Incorporated entities have **formal ownership and governance structures**:
  - Shareholders, boards of directors, and officers.
  - Example: A `Corporation` has a **board of directors** elected by shareholders.
- This is **not applicable** to entities like government agencies or registered partnerships.

### **Investment and Funding**
- Incorporated entities can **issue stock or attract investors** in ways that unincorporated or non-corporate entities cannot.
  - Example: A startup `Corporation` can **issue shares** to venture capitalists.

---

## **5. System Design Benefits**
### **Code Reuse and Extensibility**
- By specializing `IncorporatedOrganization`, you **avoid duplicating code** for attributes/methods shared by all incorporated entities (e.g., corporations, LLCs).
- Future extensions (e.g., adding a new type of incorporated entity) are **easier and more consistent**.
*/


exports.IncorporatedOrganization = RegisteredOrganization.specialize(/** @lends IncorporatedOrganization.prototype */ {
    constructor: {
        value: function IncorporatedOrganization() {
            this.super();
            return this;
        }
    }

});
