import { Request, Response } from "express";
import { prisma } from "../utils/prisma.utils.ts";
const getAllPatients = async (req: Request, res: Response): Promise<void> => {
  //i dont think this will require a req.

  try {
    const patients = await prisma.patients.findMany({
      select: {
        name: true,
        email: true,
        phone: true,
        BloodBank: true,
        BloodType: true,
        city: true,
        state: true,
        age: true,
      },
    });
    console.log(patients);

    res
      .status(200)
      .json({ message: "all data fetched successfully", patients });
  } catch (err) {
    res.status(400).json({ message: "error in fetching data", err });
    console.error(err);
  }
};
export { getAllPatients };
