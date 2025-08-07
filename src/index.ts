import express from "express";
import patientRegsitration from "../routes/patientRegistration.routes.ts";
import cookieParser from "cookie-parser";
import donorRegistration from "../routes/donorRegistration.routes.ts";
import bloodBank from "../routes/bloodBank.routes.ts";
import patientDetail from "../routes/patientDetails.routes.ts";
import PorDBycity from "../routes/getPatorDonByCity.routes.ts";
import donate from "../routes/donate.routes.ts";
import getDonations from "../routes/getActiveDonations.routes.ts";
import acceptDonation from "../routes/acceptDonation.routes.ts";
import cors from 'cors'
import getBloodRequests from "../routes/getBloodRequests.routes.ts";

const app = express();
app.use(express.json());

app.use(cors({
    origin:"http://localhost:3000",
    methods:['GET','POST'],
    credentials:true
}))

app.use(cookieParser());

const PORT: number = 5000;

app.use("/", patientRegsitration);
app.use("/", donorRegistration);
app.use("/", bloodBank);
app.use("/", patientDetail);
app.use("/", PorDBycity);
app.use("/", donate);
app.use("/", getDonations);
app.use("/donations", acceptDonation);
app.use('/',getBloodRequests)
// Make the 'generated-pdfs' folder publicly accessible under the '/certificates' route
app.use('/certificates', express.static('generated-pdfs'));
app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});
