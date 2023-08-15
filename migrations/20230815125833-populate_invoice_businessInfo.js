import { MongoClient } from "mongodb";

export const up = async (db, client) => {
  const Invoice = db.collection("invoices");
  const secondDbClient = await MongoClient.connect(
    "mongodb://localhost:27017/sme-business"
  );
  const db2 = secondDbClient.db();
  const Business = db2.collection("businesses");

  const top5Docs = await Business.find().limit(5).toArray();
  console.log("top5Docs ==> ", top5Docs);

  const documentsToBeUpdated = await Invoice.find({
    "businessInfo.businessName": { $exists: false },
  }).toArray();

  console.log("count ==> ", documentsToBeUpdated.length);

  const invoices = documentsToBeUpdated.slice(0, 5);
  console.log("invoices ==> ", invoices);

  const businessIds = invoices.map((invoice) => invoice.business);

  const businessDataMap = new Map();

  const businesses = await Business.find({
    _id: { $in: businessIds },
  }).toArray();
  for (const business of businesses) {
    businessDataMap.set(business._id.toString(), {
      profilePic: business.profilePic,
      businessName: business.name,
      address: business.address,
    });
  }

  const bulkUpdateOps = invoices.map((invoice) => {
    const businessId = invoice.business;
    const businessData = businessDataMap.get(businessId.toString());

    return {
      updateOne: {
        filter: { _id: invoice._id },
        update: {
          $set: {
            businessInfo: {
              profilePic: businessData.profilePic,
              businessName: businessData.businessName,
              address: businessData.address,
            },
          },
        },
      },
    };
  });
  const result = await Invoice.bulkWrite(bulkUpdateOps);
};

export const down = async (db, client) => {
  // TODO write the statements to rollback your migration (if possible)
};
