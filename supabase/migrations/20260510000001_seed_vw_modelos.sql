-- Seed do catálogo VW (linha brasileira 2014-2026). Idempotente via ON CONFLICT.

insert into vw_modelos (modelo, motor, combustivel, ano_inicio, ano_fim) values
-- Linha MSI (aspirados)
('Gol', '1.0 MSI', 'flex', 2014, 2024),
('Gol', '1.6 MSI', 'flex', 2014, 2024),
('Voyage', '1.0 MSI', 'flex', 2014, 2023),
('Voyage', '1.6 MSI', 'flex', 2014, 2023),
('Saveiro', '1.6 MSI', 'flex', 2014, null),
('Polo', '1.6 MSI', 'flex', 2017, null),
('Virtus', '1.6 MSI', 'flex', 2018, null),
('T-Cross', '1.6 MSI', 'flex', 2019, null),
('Up!', '1.0 MPI', 'flex', 2014, 2021),
-- Linha TSI (turbo)
('Polo', '1.0 TSI', 'flex', 2017, null),
('Polo GTS', '1.4 TSI', 'flex', 2018, 2022),
('Virtus', '1.0 TSI', 'flex', 2018, null),
('Virtus GTS', '1.4 TSI', 'flex', 2018, 2022),
('T-Cross', '1.0 TSI', 'flex', 2019, null),
('T-Cross', '1.4 TSI', 'flex', 2019, null),
('Nivus', '1.0 TSI', 'flex', 2020, null),
('Taos', '1.4 TSI', 'flex', 2021, null),
('Taos', '250 TSI', 'flex', 2021, null),
('Tiguan Allspace', '1.4 TSI', 'flex', 2018, null),
('Tiguan Allspace', '2.0 TSI', 'gasolina', 2018, null),
('Jetta', '250 TSI', 'gasolina', 2019, null),
('Jetta GLI', '350 TSI', 'gasolina', 2019, null),
('Amarok', '2.0 TDI', 'diesel', 2014, null),
('Amarok V6', '3.0 V6 TDI', 'diesel', 2018, null)
on conflict (modelo, motor) do nothing;
