import cors from "cors";
import bodyParser from "body-parser";

export default [
  cors(),
  bodyParser.json(),
  bodyParser.urlencoded({ extended: true }),
];
