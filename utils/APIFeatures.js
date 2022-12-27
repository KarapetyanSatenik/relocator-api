class APIFeatures {
  constructor(query, queryStrObj) {
    this.query = query;
    this.queryStrObj = queryStrObj;
  }

  filter() {
    const queryObj = { ...this.queryStrObj };

    //delete special fields
    ["page", "limit", "sort", "fields"].forEach((el) => delete queryObj[el]);

    let queryString = JSON.stringify(queryObj);
    queryString = queryString.replace(
      /\b(gt|gte|lt|lte)\b/g,
      (match) => `$${match}`
    );

    this.query = this.query.find(JSON.parse(queryString));
    return this;
  }

  sort() {
    if (this.queryStrObj.sort) {
      const sortBy = this.queryStrObj.sort.replace(",", " ");
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort("-createdAt");
    }
    return this;
  }

  fields() {
    if (this.queryStrObj.fields) {
      const fields = this.queryStrObj.fields.replace(",", " ");
      this.query = this.query.select(`${fields}`);
    }

    return this;
  }

  page() {
    const page = this.queryStrObj.page * 1 || 1;
    const limit = this.queryStrObj.limit * 1 || 20;

    this.query.skip((page - 1) * limit).limit(limit);

    return this;
  }
}

module.exports = APIFeatures;
