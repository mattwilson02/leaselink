-- AddForeignKey
ALTER TABLE "identity_providers" ADD CONSTRAINT "identity_providers_client_fkey" FOREIGN KEY ("user_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity_providers" ADD CONSTRAINT "identity_providers_employee_fkey" FOREIGN KEY ("user_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
