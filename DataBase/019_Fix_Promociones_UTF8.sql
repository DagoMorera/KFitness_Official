SET NOCOUNT ON;
BEGIN TRAN;

UPDATE prm.Promociones
SET Descripcion = REPLACE(
                    REPLACE(
                      Descripcion,
                      N'acompa' + NCHAR(195) + NCHAR(177) + N'ado',
                      N'acompa' + NCHAR(241) + N'ado'
                    ),
                    N'sesi' + NCHAR(195) + NCHAR(179) + N'n',
                    N'sesi' + NCHAR(243) + N'n'
                  )
WHERE Descripcion LIKE N'%acompa' + NCHAR(195) + NCHAR(177) + N'ado%'
   OR Descripcion LIKE N'%sesi' + NCHAR(195) + NCHAR(179) + N'n%';

COMMIT TRAN;
