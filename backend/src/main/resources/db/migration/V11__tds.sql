-- Conductivity (µS/cm) gives way to total dissolved solids (TDS, ppm), what hobby meters show. The values recorded
-- so far were already read from a TDS meter, so they keep their numbers.
update measurements set parameter = 'TDS' where parameter = 'CONDUCTIVITY';
