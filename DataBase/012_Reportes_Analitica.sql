/* =====================================================================
   Script:        012_Reportes_Analitica.sql
   Branch Git:    Feature/SQL
   Descripcion:   Esquema rep: vistas para reportes y analitica.
                  No crea tablas: lee de pedidos, entregas y productos.
   Criterio:      Una "venta" es un pedido que no esta cancelado.
   Reejecutable:  Si.
   ===================================================================== */

USE KFitness;
GO

IF SCHEMA_ID(N'rep') IS NULL
    EXEC (N'CREATE SCHEMA rep AUTHORIZATION dbo;');
GO

/* Una fila por pedido, con datos listos para agrupar por fecha, dia, hora o zona.
   DiaSemana: 1 = Lunes ... 7 = Domingo (igual que cfg.HorariosAtencion) */
CREATE OR ALTER VIEW rep.vw_VentasPorPedido
AS
SELECT  p.IdPedido,
        p.NumeroPedido,
        p.IdCliente,
        p.FechaPedido,
        CAST(p.FechaPedido AS DATE)                                   AS Fecha,
        (DATEDIFF(DAY, '19000101', CAST(p.FechaPedido AS DATE)) % 7) + 1 AS DiaSemana,
        DATEPART(HOUR,  p.FechaPedido)                                AS Hora,
        DATEPART(MONTH, p.FechaPedido)                                AS Mes,
        DATEPART(YEAR,  p.FechaPedido)                                AS Anio,
        e.IdZona,
        p.Subtotal, p.Descuento, p.CostoEnvio, p.Total
FROM    ped.Pedidos p
JOIN    ped.EstadosPedido s ON s.IdEstado = p.IdEstado AND s.EsCancelado = 0
LEFT JOIN env.Entregas e ON e.IdPedido = p.IdPedido;
GO

/* Ventas por dia, producto y zona (ranking, detalle y base de prediccion de demanda) */
CREATE OR ALTER VIEW rep.vw_VentasPorProducto
AS
SELECT  CAST(p.FechaPedido AS DATE) AS Fecha,
        d.IdProducto,
        pr.Nombre                   AS Producto,
        pr.IdCategoria,
        e.IdZona,
        SUM(d.Cantidad)             AS Cantidad,
        SUM(d.Subtotal)             AS Total
FROM    ped.PedidoDetalle d
JOIN    ped.Pedidos p          ON p.IdPedido = d.IdPedido
JOIN    ped.EstadosPedido s    ON s.IdEstado = p.IdEstado AND s.EsCancelado = 0
JOIN    cat.Productos pr       ON pr.IdProducto = d.IdProducto
LEFT JOIN env.Entregas e       ON e.IdPedido = p.IdPedido
GROUP BY CAST(p.FechaPedido AS DATE), d.IdProducto, pr.Nombre, pr.IdCategoria, e.IdZona;
GO

IF NOT EXISTS (SELECT 1 FROM cfg.Migraciones WHERE Script = N'012_Reportes_Analitica.sql')
    INSERT INTO cfg.Migraciones (Script, Descripcion)
    VALUES (N'012_Reportes_Analitica.sql', N'Esquema rep: vistas de ventas por pedido y por producto');
GO

-- Verificacion: 2 vistas en rep (el inventario se reporta con inv.vw_StockActual)
SELECT s.name AS Esquema, v.name AS Vista
FROM sys.views v JOIN sys.schemas s ON s.schema_id = v.schema_id
WHERE s.name = N'rep' ORDER BY v.name;
SELECT IdMigracion, Script FROM cfg.Migraciones ORDER BY IdMigracion;
GO