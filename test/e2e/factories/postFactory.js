const { Factory } = require('fishery');
const { faker } = require('@faker-js/faker');

const postFactory = Factory.define(({ params, associations }) => {
  const title = params.title || faker.lorem.sentence({ min: 3, max: 8 });
  const body = params.body || faker.lorem.paragraphs(faker.number.int({ min: 2, max: 5 }), '\n\n');
  const hasAttachment = params.hasAttachment !== undefined ? params.hasAttachment : faker.datatype.boolean();
  const createdDate = params.createdDate || faker.date.recent({ days: 30 });
  const updatedDate = params.updatedDate || createdDate;
  
  // Generate sequential id if not provided
  const id = params.id || faker.number.int({ min: 1, max: 10000 });
  
  return {
    id,
    title,
    body,
    hasAttachment,
    createdDate,
    updatedDate,
    author: associations.author || params.authorId, // ObjectId reference
  };
});

module.exports = postFactory;