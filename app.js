const express = require("express");
const PORT = process.env.PORT || 3000;
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(express.static("public"));
app.use(express.json());
app.use(cors());

app.use("/", require("./routes/root"));
app.use("/ai", require("./routes/ai"));

app.listen(PORT, () => {
  console.log(`Server runs on port ${PORT}`);
});
