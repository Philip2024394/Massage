/*
# [Data] Populate Special Activation Codes
Populates the `special_activation_codes` table with 50 unique, reusable activation codes for testing and production use.

## Query Description:
This is a safe, one-time data insertion operation. It adds 50 new rows to the `special_activation_codes` table. It does not modify or delete any existing data.

## Metadata:
- Schema-Category: "Data"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true (can be deleted manually)

## Structure Details:
- Table: public.special_activation_codes
- Columns: code

## Security Implications:
- RLS Status: Enabled
- Policy Changes: No
- Auth Requirements: Admin/Service Role

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: Negligible.
*/

INSERT INTO public.special_activation_codes (code) VALUES
('BALI-01'), ('BALI-02'), ('BALI-03'), ('BALI-04'), ('BALI-05'), ('BALI-06'), ('BALI-07'), ('BALI-08'), ('BALI-09'), ('BALI-10'),
('JAVA-01'), ('JAVA-02'), ('JAVA-03'), ('JAVA-04'), ('JAVA-05'), ('JAVA-06'), ('JAVA-07'), ('JAVA-08'), ('JAVA-09'), ('JAVA-10'),
('SUMI-01'), ('SUMI-02'), ('SUMI-03'), ('SUMI-04'), ('SUMI-05'), ('SUMI-06'), ('SUMI-07'), ('SUMI-08'), ('SUMI-09'), ('SUMI-10'),
('KALIM-01'), ('KALIM-02'), ('KALIM-03'), ('KALIM-04'), ('KALIM-05'), ('KALIM-06'), ('KALIM-07'), ('KALIM-08'), ('KALIM-09'), ('KALIM-10'),
('PAPUA-01'), ('PAPUA-02'), ('PAPUA-03'), ('PAPUA-04'), ('PAPUA-05'), ('PAPUA-06'), ('PAPUA-07'), ('PAPUA-08'), ('PAPUA-09'), ('PAPUA-10');
