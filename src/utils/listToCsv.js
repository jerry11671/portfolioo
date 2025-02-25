const Json2csvParser = require("json2csv").Parser;

const { AppError } = require("../middleware/error");

const csv = {
  async listToCsv(params, Model, pipeline) {
    const data = await Model.aggregate([...pipeline]);

    // get columns form req.quey in array
    if (!params.columns) {
      throw new AppError(
        400,
        "Please Enter 'columns' Key and Its Value As A Query Parameter e.g. columns=product_name..."
      );
    }

    const columnsQuery = params.columns.split(",");

    const columns = [];

    // trim and remove unwanted characters form columnsQuery
    // then push to columns
    for (const element of columnsQuery) {
      let values;
      values = element.trim();

      // remove space in front/back of column string
      if (values.startsWith("%20") || values.endsWith("%20")) {
        values = values.replace("%20", "");
      }

      // match only a to z or A to Z and _
      if (values.match(/[a-zA-Z_]/) && values !== "_") {
        columns.push(values);
      }
    }

    // set fields
    const fields = [];

    // loop through array of columns
    for (const element of columns) {
      // set field label and value for each column
      let label;
      const value = element;

      // capitalize each word in a label
      const capitalize_each_word = (label) => {
        const header = label.split("_");

        for (let i = 0; i < header.length; i++) {
          header[i] = header[i].charAt(0).toUpperCase() + header[i].slice(1);
        }

        return header.join(" ");
      };

      label = element;
      label = capitalize_each_word(label);

      // push object containing label and value to fields
      fields.push({
        label,
        value,
      });
    }

    const json2csvParser = new Json2csvParser({ fields });
    const csvData = json2csvParser.parse(data);

    return csvData;
  },
};

module.exports = csv;
