/*
  Warnings:

  - You are about to drop the `_EmployeeClients` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_EmployeeClients" DROP CONSTRAINT "_EmployeeClients_A_fkey";

-- DropForeignKey
ALTER TABLE "_EmployeeClients" DROP CONSTRAINT "_EmployeeClients_B_fkey";

-- DropTable
DROP TABLE "_EmployeeClients";

-- CreateTable
CREATE TABLE "employee_clients" (
    "employee_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,

    CONSTRAINT "employee_clients_pkey" PRIMARY KEY ("employee_id","client_id")
);

-- AddForeignKey
ALTER TABLE "employee_clients" ADD CONSTRAINT "employee_id" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_clients" ADD CONSTRAINT "client_id" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
