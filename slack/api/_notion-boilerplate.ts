import { Client } from "@notionhq/client";
import ClientRepository from "../../clients/repository";
import { getContactByEmail } from "../../hubspot/resources";
import {
  getIncorporationType,
  incorporationCompanyType,
  incorporationIdentifier,
} from "../utils";

export const lpPackageType = {
  PREMIUM: "Premium",
  STANDARD: "Standard",
} as const;
export type PackageType = (typeof lpPackageType)[keyof typeof lpPackageType];

const databaseIDs = {
  SOLE_PROPRIETORSHIP: "9f11ba888af84a5494d7300000949f9d",
  LLC_AND_STOCK_CORPORATION: "fe462460d94842adb737b91f44088ae8",
} as const;

export const saveIncorporation = async (
  legalProductItems: string[],
  client: ClientRepository.Interface,
  consentZKB?: boolean,
  consentKonsento?: boolean
) => {
  try {
    const notion = new Client({ auth: process.env.NOTION_API_SECRET });
    const packageType = legalProductItems.find((slug) =>
      slug.includes(lpPackageType.PREMIUM.toLowerCase())
    )
      ? lpPackageType.PREMIUM
      : legalProductItems.find((slug) =>
          slug.includes(lpPackageType.STANDARD.toLowerCase())
        )
      ? lpPackageType.STANDARD
      : undefined;
    const companyType = getIncorporationType(legalProductItems);
    const title = `${
      process.env.ENVIRONMENT !== "production" ? "TEST + " : ""
    }${client.lastName.toUpperCase()} ${client.firstName}${
      client.company?.name ? ` (${client.company.name})` : ""
    }`;
    const stage = "Vorbereitung";
    const priority = "Medium";
    const zkbConsent = consentZKB ? "Ja" : "Nein";
    const status = "Requires action";
    const database_id = legalProductItems.find(
      (slug) =>
        slug.includes(incorporationIdentifier.LLC) ||
        slug.includes(incorporationIdentifier.STOCK_CORPORTARION)
    )
      ? databaseIDs.LLC_AND_STOCK_CORPORATION
      : databaseIDs.SOLE_PROPRIETORSHIP;
    let hubspotContactURL = "https://app.hubspot.com/contacts";

    try {
      const hubspotContact = await getContactByEmail(client.email);
      hubspotContactURL = `https://app.hubspot.com/contacts/${hubspotContact.data["portal-id"]}/contact/${hubspotContact.data.vid}`;
    } catch (error) {
      console.info("Fetching Hubspot contact error", error);
    }

    const notionPage: any = {
      Name: {
        id: "title",
        title: [
          {
            type: "text",
            text: {
              content: title,
            },
          },
        ],
      },
      Rechtsform: {
        type: "select",
        select: {
          name: companyType,
        },
      },
      Status: {
        type: "multi_select",
        multi_select: [
          {
            name: status,
          },
        ],
      },
      Stage: {
        type: "select",
        select: {
          name: stage,
        },
      },
      Priority: {
        type: "select",
        select: {
          name: priority,
        },
      },
      "Einwilligung ZKB": {
        type: "select",
        select: {
          name: zkbConsent,
        },
      },

      "HubSpot contact record": {
        type: "url",
        url: hubspotContactURL,
      },
    };
    if (packageType) {
      notionPage["Gründungspaket"] = {
        select: {
          name: packageType,
        },
      };
    }
    if (companyType === incorporationCompanyType.STOCK_CORPORTARION) {
      const konsentoConsent = consentKonsento ? "Ja" : "Nein";
      notionPage["Einwilligung Konsento"] = {
        type: "select",
        select: {
          name: konsentoConsent,
        },
      };
    }
    notionPage["Requires action since"] = {
      type: "date",
      date: {
        start: new Date().toISOString().split("T")[0],
      },
    };

    return await notion.pages.create({
      parent: {
        database_id,
      },
      properties: { ...notionPage },
    });
  } catch (error) {
    throw error;
  }
};
