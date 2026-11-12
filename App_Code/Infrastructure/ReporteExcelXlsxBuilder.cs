using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.IO.Packaging;
using System.Xml;

public static class ReporteExcelXlsxBuilder
{
    private const string SpreadsheetMlNs = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
    private const string RelationshipsNs = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
    private const string OfficeDocumentRelType = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument";
    private const string WorksheetRelType = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet";
    private const string StylesRelType = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles";

    public static bool VerificarDisponibilidadPackaging()
    {
        using (MemoryStream ms = new MemoryStream())
        using (Package package = Package.Open(ms, FileMode.Create, FileAccess.ReadWrite))
        {
            return package != null;
        }
    }

    public static byte[] CrearReporteServicios(List<ServicioAdminListadoItem> servicios, DateTime fechaGeneracion)
    {
        List<ServicioAdminListadoItem> items = servicios ?? new List<ServicioAdminListadoItem>();

        using (MemoryStream ms = new MemoryStream())
        {
            using (Package package = Package.Open(ms, FileMode.Create, FileAccess.ReadWrite))
            {
                Uri workbookUri = new Uri("/xl/workbook.xml", UriKind.Relative);
                Uri worksheetUri = new Uri("/xl/worksheets/sheet1.xml", UriKind.Relative);
                Uri stylesUri = new Uri("/xl/styles.xml", UriKind.Relative);

                PackagePart workbookPart = package.CreatePart(workbookUri, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml", CompressionOption.Maximum);
                PackagePart worksheetPart = package.CreatePart(worksheetUri, "application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml", CompressionOption.Maximum);
                PackagePart stylesPart = package.CreatePart(stylesUri, "application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml", CompressionOption.Maximum);

                package.CreateRelationship(workbookUri, TargetMode.Internal, OfficeDocumentRelType);
                workbookPart.CreateRelationship(PackUriHelper.GetRelativeUri(workbookUri, worksheetUri), TargetMode.Internal, WorksheetRelType, "rId1");
                workbookPart.CreateRelationship(PackUriHelper.GetRelativeUri(workbookUri, stylesUri), TargetMode.Internal, StylesRelType, "rId2");

                using (Stream stream = workbookPart.GetStream(FileMode.Create, FileAccess.Write))
                {
                    EscribirWorkbook(stream, "Servicios");
                }

                using (Stream stream = stylesPart.GetStream(FileMode.Create, FileAccess.Write))
                {
                    EscribirStyles(stream);
                }

                using (Stream stream = worksheetPart.GetStream(FileMode.Create, FileAccess.Write))
                {
                    EscribirWorksheetServicios(stream, items, fechaGeneracion);
                }
            }

            return ms.ToArray();
        }
    }

    public static byte[] CrearReportePromociones(List<PromocionAdminItem> promociones, DateTime fechaGeneracion)
    {
        List<PromocionAdminItem> items = promociones ?? new List<PromocionAdminItem>();

        using (MemoryStream ms = new MemoryStream())
        {
            using (Package package = Package.Open(ms, FileMode.Create, FileAccess.ReadWrite))
            {
                Uri workbookUri = new Uri("/xl/workbook.xml", UriKind.Relative);
                Uri worksheetUri = new Uri("/xl/worksheets/sheet1.xml", UriKind.Relative);
                Uri stylesUri = new Uri("/xl/styles.xml", UriKind.Relative);

                PackagePart workbookPart = package.CreatePart(workbookUri, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml", CompressionOption.Maximum);
                PackagePart worksheetPart = package.CreatePart(worksheetUri, "application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml", CompressionOption.Maximum);
                PackagePart stylesPart = package.CreatePart(stylesUri, "application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml", CompressionOption.Maximum);

                package.CreateRelationship(workbookUri, TargetMode.Internal, OfficeDocumentRelType);
                workbookPart.CreateRelationship(PackUriHelper.GetRelativeUri(workbookUri, worksheetUri), TargetMode.Internal, WorksheetRelType, "rId1");
                workbookPart.CreateRelationship(PackUriHelper.GetRelativeUri(workbookUri, stylesUri), TargetMode.Internal, StylesRelType, "rId2");

                using (Stream stream = workbookPart.GetStream(FileMode.Create, FileAccess.Write))
                {
                    EscribirWorkbook(stream, "Promociones");
                }

                using (Stream stream = stylesPart.GetStream(FileMode.Create, FileAccess.Write))
                {
                    EscribirStyles(stream);
                }

                using (Stream stream = worksheetPart.GetStream(FileMode.Create, FileAccess.Write))
                {
                    EscribirWorksheetPromociones(stream, items, fechaGeneracion);
                }
            }

            return ms.ToArray();
        }
    }

    public static byte[] CrearReporteReservas(List<ReservaAdminItem> reservas, DateTime fechaGeneracion)
    {
        List<ReservaAdminItem> items = reservas ?? new List<ReservaAdminItem>();

        using (MemoryStream ms = new MemoryStream())
        {
            using (Package package = Package.Open(ms, FileMode.Create, FileAccess.ReadWrite))
            {
                Uri workbookUri = new Uri("/xl/workbook.xml", UriKind.Relative);
                Uri worksheetUri = new Uri("/xl/worksheets/sheet1.xml", UriKind.Relative);
                Uri stylesUri = new Uri("/xl/styles.xml", UriKind.Relative);

                PackagePart workbookPart = package.CreatePart(workbookUri, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml", CompressionOption.Maximum);
                PackagePart worksheetPart = package.CreatePart(worksheetUri, "application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml", CompressionOption.Maximum);
                PackagePart stylesPart = package.CreatePart(stylesUri, "application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml", CompressionOption.Maximum);

                package.CreateRelationship(workbookUri, TargetMode.Internal, OfficeDocumentRelType);
                workbookPart.CreateRelationship(PackUriHelper.GetRelativeUri(workbookUri, worksheetUri), TargetMode.Internal, WorksheetRelType, "rId1");
                workbookPart.CreateRelationship(PackUriHelper.GetRelativeUri(workbookUri, stylesUri), TargetMode.Internal, StylesRelType, "rId2");

                using (Stream stream = workbookPart.GetStream(FileMode.Create, FileAccess.Write))
                {
                    EscribirWorkbook(stream, "Reservas");
                }

                using (Stream stream = stylesPart.GetStream(FileMode.Create, FileAccess.Write))
                {
                    EscribirStyles(stream);
                }

                using (Stream stream = worksheetPart.GetStream(FileMode.Create, FileAccess.Write))
                {
                    EscribirWorksheetReservas(stream, items, fechaGeneracion);
                }
            }

            return ms.ToArray();
        }
    }

    public static byte[] CrearReporteUsuarios(List<AdminUsuarioListadoItem> usuarios, DateTime fechaGeneracion)
    {
        List<AdminUsuarioListadoItem> items = usuarios ?? new List<AdminUsuarioListadoItem>();

        using (MemoryStream ms = new MemoryStream())
        {
            using (Package package = Package.Open(ms, FileMode.Create, FileAccess.ReadWrite))
            {
                Uri workbookUri = new Uri("/xl/workbook.xml", UriKind.Relative);
                Uri worksheetUri = new Uri("/xl/worksheets/sheet1.xml", UriKind.Relative);
                Uri stylesUri = new Uri("/xl/styles.xml", UriKind.Relative);

                PackagePart workbookPart = package.CreatePart(workbookUri, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml", CompressionOption.Maximum);
                PackagePart worksheetPart = package.CreatePart(worksheetUri, "application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml", CompressionOption.Maximum);
                PackagePart stylesPart = package.CreatePart(stylesUri, "application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml", CompressionOption.Maximum);

                package.CreateRelationship(workbookUri, TargetMode.Internal, OfficeDocumentRelType);
                workbookPart.CreateRelationship(PackUriHelper.GetRelativeUri(workbookUri, worksheetUri), TargetMode.Internal, WorksheetRelType, "rId1");
                workbookPart.CreateRelationship(PackUriHelper.GetRelativeUri(workbookUri, stylesUri), TargetMode.Internal, StylesRelType, "rId2");

                using (Stream stream = workbookPart.GetStream(FileMode.Create, FileAccess.Write))
                {
                    EscribirWorkbook(stream, "Usuarios");
                }

                using (Stream stream = stylesPart.GetStream(FileMode.Create, FileAccess.Write))
                {
                    EscribirStyles(stream);
                }

                using (Stream stream = worksheetPart.GetStream(FileMode.Create, FileAccess.Write))
                {
                    EscribirWorksheetUsuarios(stream, items, fechaGeneracion);
                }
            }

            return ms.ToArray();
        }
    }

    private static void EscribirWorkbook(Stream stream, string nombreHoja)
    {
        XmlWriterSettings settings = new XmlWriterSettings();
        settings.Encoding = new System.Text.UTF8Encoding(false);
        settings.Indent = false;

        using (XmlWriter writer = XmlWriter.Create(stream, settings))
        {
            writer.WriteStartDocument(true);
            writer.WriteStartElement("workbook", SpreadsheetMlNs);
            writer.WriteAttributeString("xmlns", "r", null, RelationshipsNs);

            writer.WriteStartElement("sheets", SpreadsheetMlNs);
            writer.WriteStartElement("sheet", SpreadsheetMlNs);
            writer.WriteAttributeString("name", string.IsNullOrWhiteSpace(nombreHoja) ? "Reporte" : nombreHoja);
            writer.WriteAttributeString("sheetId", "1");
            writer.WriteAttributeString("r", "id", RelationshipsNs, "rId1");
            writer.WriteEndElement();
            writer.WriteEndElement();

            writer.WriteEndElement();
            writer.WriteEndDocument();
        }
    }

    private static void EscribirStyles(Stream stream)
    {
        XmlWriterSettings settings = new XmlWriterSettings();
        settings.Encoding = new System.Text.UTF8Encoding(false);
        settings.Indent = false;

        using (XmlWriter writer = XmlWriter.Create(stream, settings))
        {
            writer.WriteStartDocument(true);
            writer.WriteStartElement("styleSheet", SpreadsheetMlNs);

            writer.WriteStartElement("numFmts", SpreadsheetMlNs);
            writer.WriteAttributeString("count", "1");
            writer.WriteStartElement("numFmt", SpreadsheetMlNs);
            writer.WriteAttributeString("numFmtId", "164");
            writer.WriteAttributeString("formatCode", "[$₡-140A] #,##0");
            writer.WriteEndElement();
            writer.WriteEndElement();

            writer.WriteStartElement("fonts", SpreadsheetMlNs);
            writer.WriteAttributeString("count", "3");

            writer.WriteStartElement("font", SpreadsheetMlNs);
            writer.WriteStartElement("sz", SpreadsheetMlNs); writer.WriteAttributeString("val", "11"); writer.WriteEndElement();
            writer.WriteStartElement("color", SpreadsheetMlNs); writer.WriteAttributeString("theme", "1"); writer.WriteEndElement();
            writer.WriteStartElement("name", SpreadsheetMlNs); writer.WriteAttributeString("val", "Calibri"); writer.WriteEndElement();
            writer.WriteStartElement("family", SpreadsheetMlNs); writer.WriteAttributeString("val", "2"); writer.WriteEndElement();
            writer.WriteEndElement();

            writer.WriteStartElement("font", SpreadsheetMlNs);
            writer.WriteStartElement("b", SpreadsheetMlNs); writer.WriteEndElement();
            writer.WriteStartElement("sz", SpreadsheetMlNs); writer.WriteAttributeString("val", "15"); writer.WriteEndElement();
            writer.WriteStartElement("color", SpreadsheetMlNs); writer.WriteAttributeString("rgb", "FFFFFFFF"); writer.WriteEndElement();
            writer.WriteStartElement("name", SpreadsheetMlNs); writer.WriteAttributeString("val", "Calibri"); writer.WriteEndElement();
            writer.WriteStartElement("family", SpreadsheetMlNs); writer.WriteAttributeString("val", "2"); writer.WriteEndElement();
            writer.WriteEndElement();

            writer.WriteStartElement("font", SpreadsheetMlNs);
            writer.WriteStartElement("b", SpreadsheetMlNs); writer.WriteEndElement();
            writer.WriteStartElement("sz", SpreadsheetMlNs); writer.WriteAttributeString("val", "11"); writer.WriteEndElement();
            writer.WriteStartElement("color", SpreadsheetMlNs); writer.WriteAttributeString("rgb", "FFFFFFFF"); writer.WriteEndElement();
            writer.WriteStartElement("name", SpreadsheetMlNs); writer.WriteAttributeString("val", "Calibri"); writer.WriteEndElement();
            writer.WriteStartElement("family", SpreadsheetMlNs); writer.WriteAttributeString("val", "2"); writer.WriteEndElement();
            writer.WriteEndElement();

            writer.WriteEndElement();

            writer.WriteStartElement("fills", SpreadsheetMlNs);
            writer.WriteAttributeString("count", "4");
            writer.WriteStartElement("fill", SpreadsheetMlNs);
            writer.WriteStartElement("patternFill", SpreadsheetMlNs); writer.WriteAttributeString("patternType", "none"); writer.WriteEndElement();
            writer.WriteEndElement();
            writer.WriteStartElement("fill", SpreadsheetMlNs);
            writer.WriteStartElement("patternFill", SpreadsheetMlNs); writer.WriteAttributeString("patternType", "gray125"); writer.WriteEndElement();
            writer.WriteEndElement();
            writer.WriteStartElement("fill", SpreadsheetMlNs);
            writer.WriteStartElement("patternFill", SpreadsheetMlNs);
            writer.WriteAttributeString("patternType", "solid");
            writer.WriteStartElement("fgColor", SpreadsheetMlNs); writer.WriteAttributeString("rgb", "FF1E1E1E"); writer.WriteEndElement();
            writer.WriteStartElement("bgColor", SpreadsheetMlNs); writer.WriteAttributeString("indexed", "64"); writer.WriteEndElement();
            writer.WriteEndElement();
            writer.WriteEndElement();
            writer.WriteStartElement("fill", SpreadsheetMlNs);
            writer.WriteStartElement("patternFill", SpreadsheetMlNs);
            writer.WriteAttributeString("patternType", "solid");
            writer.WriteStartElement("fgColor", SpreadsheetMlNs); writer.WriteAttributeString("rgb", "FFB71C1C"); writer.WriteEndElement();
            writer.WriteStartElement("bgColor", SpreadsheetMlNs); writer.WriteAttributeString("indexed", "64"); writer.WriteEndElement();
            writer.WriteEndElement();
            writer.WriteEndElement();
            writer.WriteEndElement();

            writer.WriteStartElement("borders", SpreadsheetMlNs);
            writer.WriteAttributeString("count", "1");
            writer.WriteStartElement("border", SpreadsheetMlNs);
            writer.WriteElementString("left", SpreadsheetMlNs, string.Empty);
            writer.WriteElementString("right", SpreadsheetMlNs, string.Empty);
            writer.WriteElementString("top", SpreadsheetMlNs, string.Empty);
            writer.WriteElementString("bottom", SpreadsheetMlNs, string.Empty);
            writer.WriteElementString("diagonal", SpreadsheetMlNs, string.Empty);
            writer.WriteEndElement();
            writer.WriteEndElement();

            writer.WriteStartElement("cellStyleXfs", SpreadsheetMlNs);
            writer.WriteAttributeString("count", "1");
            writer.WriteStartElement("xf", SpreadsheetMlNs);
            writer.WriteAttributeString("numFmtId", "0");
            writer.WriteAttributeString("fontId", "0");
            writer.WriteAttributeString("fillId", "0");
            writer.WriteAttributeString("borderId", "0");
            writer.WriteEndElement();
            writer.WriteEndElement();

            writer.WriteStartElement("cellXfs", SpreadsheetMlNs);
            writer.WriteAttributeString("count", "7");

            EscribirXf(writer, "0", "0", "0", "0", null, false, false);
            EscribirXf(writer, "0", "1", "2", "0", "center", true, true);
            EscribirXf(writer, "0", "0", "0", "0", null, false, false);
            EscribirXf(writer, "0", "2", "3", "0", "center", true, true);
            EscribirXf(writer, "164", "0", "0", "0", null, true, false);
            EscribirXf(writer, "0", "2", "0", "0", null, false, false);
            EscribirXf(writer, "0", "2", "0", "0", "right", true, false);

            writer.WriteEndElement();

            writer.WriteStartElement("cellStyles", SpreadsheetMlNs);
            writer.WriteAttributeString("count", "1");
            writer.WriteStartElement("cellStyle", SpreadsheetMlNs);
            writer.WriteAttributeString("name", "Normal");
            writer.WriteAttributeString("xfId", "0");
            writer.WriteAttributeString("builtinId", "0");
            writer.WriteEndElement();
            writer.WriteEndElement();

            writer.WriteEndElement();
            writer.WriteEndDocument();
        }
    }

    private static void EscribirXf(XmlWriter writer, string numFmtId, string fontId, string fillId, string borderId, string horizontal, bool applyAlignment, bool applyFill)
    {
        writer.WriteStartElement("xf", SpreadsheetMlNs);
        writer.WriteAttributeString("numFmtId", numFmtId);
        writer.WriteAttributeString("fontId", fontId);
        writer.WriteAttributeString("fillId", fillId);
        writer.WriteAttributeString("borderId", borderId);
        writer.WriteAttributeString("xfId", "0");

        if (numFmtId == "164")
        {
            writer.WriteAttributeString("applyNumberFormat", "1");
        }

        if (applyFill)
        {
            writer.WriteAttributeString("applyFill", "1");
        }

        if (applyAlignment)
        {
            writer.WriteAttributeString("applyAlignment", "1");
            writer.WriteStartElement("alignment", SpreadsheetMlNs);
            writer.WriteAttributeString("horizontal", string.IsNullOrEmpty(horizontal) ? "left" : horizontal);
            writer.WriteAttributeString("vertical", "center");
            writer.WriteEndElement();
        }

        writer.WriteEndElement();
    }

    private static void EscribirWorksheetServicios(Stream stream, List<ServicioAdminListadoItem> items, DateTime fechaGeneracion)
    {
        int encabezadoFila = 4;
        int inicioDatosFila = 5;
        int finDatosFila = inicioDatosFila + Math.Max(items.Count - 1, 0);
        int filaTotalesInicio = finDatosFila + 2;

        int totalServicios = items.Count;
        int totalActivos = 0;
        int totalInactivos = 0;

        for (int i = 0; i < items.Count; i += 1)
        {
            if (items[i] != null && items[i].Activo) totalActivos += 1;
            else totalInactivos += 1;
        }

        XmlWriterSettings settings = new XmlWriterSettings();
        settings.Encoding = new System.Text.UTF8Encoding(false);
        settings.Indent = false;

        using (XmlWriter writer = XmlWriter.Create(stream, settings))
        {
            writer.WriteStartDocument(true);
            writer.WriteStartElement("worksheet", SpreadsheetMlNs);

            writer.WriteStartElement("sheetViews", SpreadsheetMlNs);
            writer.WriteStartElement("sheetView", SpreadsheetMlNs);
            writer.WriteAttributeString("workbookViewId", "0");
            writer.WriteEndElement();
            writer.WriteEndElement();

            writer.WriteStartElement("sheetFormatPr", SpreadsheetMlNs);
            writer.WriteAttributeString("defaultRowHeight", "15");
            writer.WriteEndElement();

            writer.WriteStartElement("cols", SpreadsheetMlNs);
            EscribirColumna(writer, 1, 1, 38);
            EscribirColumna(writer, 2, 2, 24);
            EscribirColumna(writer, 3, 3, 16);
            EscribirColumna(writer, 4, 4, 16);
            writer.WriteEndElement();

            writer.WriteStartElement("sheetData", SpreadsheetMlNs);

            writer.WriteStartElement("row", SpreadsheetMlNs);
            writer.WriteAttributeString("r", "1");
            EscribirCeldaTexto(writer, "A1", "KFitness — Reporte de servicios", 1);
            writer.WriteEndElement();

            writer.WriteStartElement("row", SpreadsheetMlNs);
            writer.WriteAttributeString("r", "2");
            EscribirCeldaTexto(writer, "A2", "Fecha de generación: " + fechaGeneracion.ToString("dd/MM/yyyy HH:mm", CultureInfo.InvariantCulture), 2);
            writer.WriteEndElement();

            writer.WriteStartElement("row", SpreadsheetMlNs);
            writer.WriteAttributeString("r", encabezadoFila.ToString(CultureInfo.InvariantCulture));
            EscribirCeldaTexto(writer, "A" + encabezadoFila, "Nombre", 3);
            EscribirCeldaTexto(writer, "B" + encabezadoFila, "Categoría", 3);
            EscribirCeldaTexto(writer, "C" + encabezadoFila, "Precio", 3);
            EscribirCeldaTexto(writer, "D" + encabezadoFila, "Estado", 3);
            writer.WriteEndElement();

            for (int i = 0; i < items.Count; i += 1)
            {
                ServicioAdminListadoItem item = items[i] ?? new ServicioAdminListadoItem();
                int fila = inicioDatosFila + i;

                writer.WriteStartElement("row", SpreadsheetMlNs);
                writer.WriteAttributeString("r", fila.ToString(CultureInfo.InvariantCulture));

                EscribirCeldaTexto(writer, "A" + fila, item.Nombre ?? string.Empty, 0);
                EscribirCeldaTexto(writer, "B" + fila, item.Categoria ?? string.Empty, 0);
                EscribirCeldaNumero(writer, "C" + fila, item.Precio, 4);
                EscribirCeldaTexto(writer, "D" + fila, item.Activo ? "Activo" : "Inactivo", 0);

                writer.WriteEndElement();
            }

            EscribirFilaTotal(writer, filaTotalesInicio, "Total de servicios", totalServicios);
            EscribirFilaTotal(writer, filaTotalesInicio + 1, "Total de servicios activos", totalActivos);
            EscribirFilaTotal(writer, filaTotalesInicio + 2, "Total de servicios inactivos", totalInactivos);

            writer.WriteEndElement();

            writer.WriteStartElement("mergeCells", SpreadsheetMlNs);
            writer.WriteAttributeString("count", "1");
            writer.WriteStartElement("mergeCell", SpreadsheetMlNs);
            writer.WriteAttributeString("ref", "A1:D1");
            writer.WriteEndElement();
            writer.WriteEndElement();

            int autoFiltroFin = Math.Max(finDatosFila, encabezadoFila);
            writer.WriteStartElement("autoFilter", SpreadsheetMlNs);
            writer.WriteAttributeString("ref", "A" + encabezadoFila + ":D" + autoFiltroFin.ToString(CultureInfo.InvariantCulture));
            writer.WriteEndElement();

            writer.WriteEndElement();
            writer.WriteEndDocument();
        }
    }

    private static void EscribirWorksheetPromociones(Stream stream, List<PromocionAdminItem> items, DateTime fechaGeneracion)
    {
        int encabezadoFila = 4;
        int inicioDatosFila = 5;
        int finDatosFila = inicioDatosFila + Math.Max(items.Count - 1, 0);
        int filaTotalesInicio = finDatosFila + 2;

        int totalPromociones = items.Count;
        int totalActivas = 0;
        int totalInactivas = 0;
        int totalVigentes = 0;
        DateTime hoy = DateTime.Today;

        for (int i = 0; i < items.Count; i += 1)
        {
            PromocionAdminItem item = items[i] ?? new PromocionAdminItem();
            if (item.Activo) totalActivas += 1;
            else totalInactivas += 1;

            if (hoy >= item.FechaInicio.Date && hoy <= item.FechaFin.Date)
            {
                totalVigentes += 1;
            }
        }

        XmlWriterSettings settings = new XmlWriterSettings();
        settings.Encoding = new System.Text.UTF8Encoding(false);
        settings.Indent = false;

        using (XmlWriter writer = XmlWriter.Create(stream, settings))
        {
            writer.WriteStartDocument(true);
            writer.WriteStartElement("worksheet", SpreadsheetMlNs);

            writer.WriteStartElement("sheetViews", SpreadsheetMlNs);
            writer.WriteStartElement("sheetView", SpreadsheetMlNs);
            writer.WriteAttributeString("workbookViewId", "0");
            writer.WriteEndElement();
            writer.WriteEndElement();

            writer.WriteStartElement("sheetFormatPr", SpreadsheetMlNs);
            writer.WriteAttributeString("defaultRowHeight", "15");
            writer.WriteEndElement();

            writer.WriteStartElement("cols", SpreadsheetMlNs);
            EscribirColumna(writer, 1, 1, 34);
            EscribirColumna(writer, 2, 2, 20);
            EscribirColumna(writer, 3, 3, 22);
            EscribirColumna(writer, 4, 4, 18);
            EscribirColumna(writer, 5, 5, 18);
            EscribirColumna(writer, 6, 6, 14);
            EscribirColumna(writer, 7, 7, 14);
            writer.WriteEndElement();

            writer.WriteStartElement("sheetData", SpreadsheetMlNs);

            writer.WriteStartElement("row", SpreadsheetMlNs);
            writer.WriteAttributeString("r", "1");
            EscribirCeldaTexto(writer, "A1", "KFitness — Reporte de promociones", 1);
            writer.WriteEndElement();

            writer.WriteStartElement("row", SpreadsheetMlNs);
            writer.WriteAttributeString("r", "2");
            EscribirCeldaTexto(writer, "A2", "Fecha de generación: " + fechaGeneracion.ToString("dd/MM/yyyy HH:mm", CultureInfo.InvariantCulture), 2);
            writer.WriteEndElement();

            writer.WriteStartElement("row", SpreadsheetMlNs);
            writer.WriteAttributeString("r", encabezadoFila.ToString(CultureInfo.InvariantCulture));
            EscribirCeldaTexto(writer, "A" + encabezadoFila, "Nombre de promoción", 3);
            EscribirCeldaTexto(writer, "B" + encabezadoFila, "Tipo", 3);
            EscribirCeldaTexto(writer, "C" + encabezadoFila, "Descuento o beneficio", 3);
            EscribirCeldaTexto(writer, "D" + encabezadoFila, "Fecha inicio", 3);
            EscribirCeldaTexto(writer, "E" + encabezadoFila, "Fecha fin", 3);
            EscribirCeldaTexto(writer, "F" + encabezadoFila, "Estado", 3);
            EscribirCeldaTexto(writer, "G" + encabezadoFila, "Vigencia", 3);
            writer.WriteEndElement();

            for (int i = 0; i < items.Count; i += 1)
            {
                PromocionAdminItem item = items[i] ?? new PromocionAdminItem();
                int fila = inicioDatosFila + i;

                string tipo = (item.TipoPromocion ?? string.Empty).Trim().ToUpperInvariant();
                string beneficio = string.Empty;
                if (tipo == "PORCENTAJE")
                {
                    beneficio = decimal.Round(item.PorcentajeDescuento, 2, MidpointRounding.AwayFromZero).ToString("0.##", CultureInfo.InvariantCulture) + "%";
                }
                else if (tipo == "DOS_POR_UNO")
                {
                    int compra = item.CantidadCompra.HasValue ? item.CantidadCompra.Value : 0;
                    int entrega = item.CantidadEntrega.HasValue ? item.CantidadEntrega.Value : 0;
                    beneficio = compra.ToString(CultureInfo.InvariantCulture) + "x" + entrega.ToString(CultureInfo.InvariantCulture);
                }

                string vigencia = "Vigente";
                if (hoy < item.FechaInicio.Date) vigencia = "Próxima";
                else if (hoy > item.FechaFin.Date) vigencia = "Vencida";

                writer.WriteStartElement("row", SpreadsheetMlNs);
                writer.WriteAttributeString("r", fila.ToString(CultureInfo.InvariantCulture));

                EscribirCeldaTexto(writer, "A" + fila, item.Nombre ?? string.Empty, 0);
                EscribirCeldaTexto(writer, "B" + fila, item.TipoPromocion ?? string.Empty, 0);
                EscribirCeldaTexto(writer, "C" + fila, beneficio, 0);
                EscribirCeldaTexto(writer, "D" + fila, item.FechaInicio.ToString("dd/MM/yyyy", CultureInfo.InvariantCulture), 0);
                EscribirCeldaTexto(writer, "E" + fila, item.FechaFin.ToString("dd/MM/yyyy", CultureInfo.InvariantCulture), 0);
                EscribirCeldaTexto(writer, "F" + fila, item.Activo ? "Activo" : "Inactivo", 0);
                EscribirCeldaTexto(writer, "G" + fila, vigencia, 0);

                writer.WriteEndElement();
            }

            EscribirFilaTotal(writer, filaTotalesInicio, "Total de promociones", totalPromociones);
            EscribirFilaTotal(writer, filaTotalesInicio + 1, "Promociones activas", totalActivas);
            EscribirFilaTotal(writer, filaTotalesInicio + 2, "Promociones inactivas", totalInactivas);
            EscribirFilaTotal(writer, filaTotalesInicio + 3, "Promociones vigentes", totalVigentes);

            writer.WriteEndElement();

            writer.WriteStartElement("mergeCells", SpreadsheetMlNs);
            writer.WriteAttributeString("count", "1");
            writer.WriteStartElement("mergeCell", SpreadsheetMlNs);
            writer.WriteAttributeString("ref", "A1:G1");
            writer.WriteEndElement();
            writer.WriteEndElement();

            int autoFiltroFin = Math.Max(finDatosFila, encabezadoFila);
            writer.WriteStartElement("autoFilter", SpreadsheetMlNs);
            writer.WriteAttributeString("ref", "A" + encabezadoFila + ":G" + autoFiltroFin.ToString(CultureInfo.InvariantCulture));
            writer.WriteEndElement();

            writer.WriteEndElement();
            writer.WriteEndDocument();
        }
    }

    private static void EscribirWorksheetReservas(Stream stream, List<ReservaAdminItem> items, DateTime fechaGeneracion)
    {
        int encabezadoFila = 4;
        int inicioDatosFila = 5;
        int finDatosFila = inicioDatosFila + Math.Max(items.Count - 1, 0);
        int filaTotalesInicio = finDatosFila + 2;

        int total = items.Count;
        int confirmadas = 0;
        int canceladas = 0;
        int otros = 0;

        for (int i = 0; i < items.Count; i += 1)
        {
            string estado = (items[i] != null ? items[i].Estado : string.Empty) ?? string.Empty;
            estado = estado.Trim().ToUpperInvariant();

            if (estado == "CONFIRMADA") confirmadas += 1;
            else if (estado == "CANCELADA") canceladas += 1;
            else otros += 1;
        }

        XmlWriterSettings settings = new XmlWriterSettings();
        settings.Encoding = new System.Text.UTF8Encoding(false);
        settings.Indent = false;

        using (XmlWriter writer = XmlWriter.Create(stream, settings))
        {
            writer.WriteStartDocument(true);
            writer.WriteStartElement("worksheet", SpreadsheetMlNs);

            writer.WriteStartElement("sheetViews", SpreadsheetMlNs);
            writer.WriteStartElement("sheetView", SpreadsheetMlNs);
            writer.WriteAttributeString("workbookViewId", "0");
            writer.WriteEndElement();
            writer.WriteEndElement();

            writer.WriteStartElement("sheetFormatPr", SpreadsheetMlNs);
            writer.WriteAttributeString("defaultRowHeight", "15");
            writer.WriteEndElement();

            writer.WriteStartElement("cols", SpreadsheetMlNs);
            EscribirColumna(writer, 1, 1, 14);
            EscribirColumna(writer, 2, 2, 28);
            EscribirColumna(writer, 3, 3, 30);
            EscribirColumna(writer, 4, 4, 18);
            EscribirColumna(writer, 5, 5, 16);
            EscribirColumna(writer, 6, 6, 18);
            writer.WriteEndElement();

            writer.WriteStartElement("sheetData", SpreadsheetMlNs);

            writer.WriteStartElement("row", SpreadsheetMlNs);
            writer.WriteAttributeString("r", "1");
            EscribirCeldaTexto(writer, "A1", "KFitness — Reporte de reservas", 1);
            writer.WriteEndElement();

            writer.WriteStartElement("row", SpreadsheetMlNs);
            writer.WriteAttributeString("r", "2");
            EscribirCeldaTexto(writer, "A2", "Fecha de generación: " + fechaGeneracion.ToString("dd/MM/yyyy HH:mm", CultureInfo.InvariantCulture), 2);
            writer.WriteEndElement();

            writer.WriteStartElement("row", SpreadsheetMlNs);
            writer.WriteAttributeString("r", encabezadoFila.ToString(CultureInfo.InvariantCulture));
            EscribirCeldaTexto(writer, "A" + encabezadoFila, "ID Reserva", 3);
            EscribirCeldaTexto(writer, "B" + encabezadoFila, "Servicio", 3);
            EscribirCeldaTexto(writer, "C" + encabezadoFila, "Usuario", 3);
            EscribirCeldaTexto(writer, "D" + encabezadoFila, "Fecha y hora actividad", 3);
            EscribirCeldaTexto(writer, "E" + encabezadoFila, "Estado", 3);
            EscribirCeldaTexto(writer, "F" + encabezadoFila, "Fecha de creación", 3);
            writer.WriteEndElement();

            for (int i = 0; i < items.Count; i += 1)
            {
                ReservaAdminItem item = items[i] ?? new ReservaAdminItem();
                int fila = inicioDatosFila + i;

                string usuario = (item.Cliente ?? string.Empty).Trim();
                if (string.IsNullOrEmpty(usuario)) usuario = item.Correo ?? string.Empty;

                string fechaHoraActividad = item.Fecha.ToString("dd/MM/yyyy", CultureInfo.InvariantCulture)
                    + " " + item.HoraInicio.ToString(@"hh\:mm");

                writer.WriteStartElement("row", SpreadsheetMlNs);
                writer.WriteAttributeString("r", fila.ToString(CultureInfo.InvariantCulture));
                EscribirCeldaNumero(writer, "A" + fila, item.IdReserva, 0);
                EscribirCeldaTexto(writer, "B" + fila, item.Servicio ?? string.Empty, 0);
                EscribirCeldaTexto(writer, "C" + fila, usuario, 0);
                EscribirCeldaTexto(writer, "D" + fila, fechaHoraActividad, 0);
                EscribirCeldaTexto(writer, "E" + fila, item.Estado ?? string.Empty, 0);
                EscribirCeldaTexto(writer, "F" + fila, item.FechaCreacion.ToString("dd/MM/yyyy", CultureInfo.InvariantCulture), 0);
                writer.WriteEndElement();
            }

            EscribirFilaTotal(writer, filaTotalesInicio, "Total de reservas", total);
            EscribirFilaTotal(writer, filaTotalesInicio + 1, "Reservas confirmadas", confirmadas);
            EscribirFilaTotal(writer, filaTotalesInicio + 2, "Reservas canceladas", canceladas);
            EscribirFilaTotal(writer, filaTotalesInicio + 3, "Reservas en otros estados", otros);

            writer.WriteEndElement();

            writer.WriteStartElement("mergeCells", SpreadsheetMlNs);
            writer.WriteAttributeString("count", "1");
            writer.WriteStartElement("mergeCell", SpreadsheetMlNs);
            writer.WriteAttributeString("ref", "A1:F1");
            writer.WriteEndElement();
            writer.WriteEndElement();

            int autoFiltroFin = Math.Max(finDatosFila, encabezadoFila);
            writer.WriteStartElement("autoFilter", SpreadsheetMlNs);
            writer.WriteAttributeString("ref", "A" + encabezadoFila + ":F" + autoFiltroFin.ToString(CultureInfo.InvariantCulture));
            writer.WriteEndElement();

            writer.WriteEndElement();
            writer.WriteEndDocument();
        }
    }

    private static void EscribirWorksheetUsuarios(Stream stream, List<AdminUsuarioListadoItem> items, DateTime fechaGeneracion)
    {
        int encabezadoFila = 4;
        int inicioDatosFila = 5;
        int finDatosFila = inicioDatosFila + Math.Max(items.Count - 1, 0);
        int filaTotalesInicio = finDatosFila + 2;

        int total = items.Count;
        int activos = 0;
        int inactivos = 0;
        List<string> rolesUnicos = new List<string>();

        for (int i = 0; i < items.Count; i += 1)
        {
            AdminUsuarioListadoItem item = items[i] ?? new AdminUsuarioListadoItem();
            if (item.Activo) activos += 1;
            else inactivos += 1;

            string rol = (item.Rol ?? string.Empty).Trim();
            if (!string.IsNullOrEmpty(rol) && !ContieneTextoIgnorandoMayusculas(rolesUnicos, rol))
            {
                rolesUnicos.Add(rol);
            }
        }

        XmlWriterSettings settings = new XmlWriterSettings();
        settings.Encoding = new System.Text.UTF8Encoding(false);
        settings.Indent = false;

        using (XmlWriter writer = XmlWriter.Create(stream, settings))
        {
            writer.WriteStartDocument(true);
            writer.WriteStartElement("worksheet", SpreadsheetMlNs);

            writer.WriteStartElement("sheetViews", SpreadsheetMlNs);
            writer.WriteStartElement("sheetView", SpreadsheetMlNs);
            writer.WriteAttributeString("workbookViewId", "0");
            writer.WriteEndElement();
            writer.WriteEndElement();

            writer.WriteStartElement("sheetFormatPr", SpreadsheetMlNs);
            writer.WriteAttributeString("defaultRowHeight", "15");
            writer.WriteEndElement();

            writer.WriteStartElement("cols", SpreadsheetMlNs);
            EscribirColumna(writer, 1, 1, 36);
            EscribirColumna(writer, 2, 2, 34);
            EscribirColumna(writer, 3, 3, 22);
            EscribirColumna(writer, 4, 4, 14);
            writer.WriteEndElement();

            writer.WriteStartElement("sheetData", SpreadsheetMlNs);

            writer.WriteStartElement("row", SpreadsheetMlNs);
            writer.WriteAttributeString("r", "1");
            EscribirCeldaTexto(writer, "A1", "KFitness — Reporte de usuarios", 1);
            writer.WriteEndElement();

            writer.WriteStartElement("row", SpreadsheetMlNs);
            writer.WriteAttributeString("r", "2");
            EscribirCeldaTexto(writer, "A2", "Fecha de generación: " + fechaGeneracion.ToString("dd/MM/yyyy HH:mm", CultureInfo.InvariantCulture), 2);
            writer.WriteEndElement();

            writer.WriteStartElement("row", SpreadsheetMlNs);
            writer.WriteAttributeString("r", encabezadoFila.ToString(CultureInfo.InvariantCulture));
            EscribirCeldaTexto(writer, "A" + encabezadoFila, "Nombre", 3);
            EscribirCeldaTexto(writer, "B" + encabezadoFila, "Correo", 3);
            EscribirCeldaTexto(writer, "C" + encabezadoFila, "Rol", 3);
            EscribirCeldaTexto(writer, "D" + encabezadoFila, "Estado", 3);
            writer.WriteEndElement();

            for (int i = 0; i < items.Count; i += 1)
            {
                AdminUsuarioListadoItem item = items[i] ?? new AdminUsuarioListadoItem();
                int fila = inicioDatosFila + i;

                writer.WriteStartElement("row", SpreadsheetMlNs);
                writer.WriteAttributeString("r", fila.ToString(CultureInfo.InvariantCulture));
                EscribirCeldaTexto(writer, "A" + fila, item.NombreCompleto ?? string.Empty, 0);
                EscribirCeldaTexto(writer, "B" + fila, item.Correo ?? string.Empty, 0);
                EscribirCeldaTexto(writer, "C" + fila, item.Rol ?? string.Empty, 0);
                EscribirCeldaTexto(writer, "D" + fila, item.Activo ? "Activo" : "Inactivo", 0);
                writer.WriteEndElement();
            }

            EscribirFilaTotal(writer, filaTotalesInicio, "Total de usuarios", total);
            EscribirFilaTotal(writer, filaTotalesInicio + 1, "Usuarios activos", activos);
            EscribirFilaTotal(writer, filaTotalesInicio + 2, "Usuarios inactivos", inactivos);
            EscribirFilaTotal(writer, filaTotalesInicio + 3, "Roles únicos", rolesUnicos.Count);

            writer.WriteEndElement();

            writer.WriteStartElement("mergeCells", SpreadsheetMlNs);
            writer.WriteAttributeString("count", "1");
            writer.WriteStartElement("mergeCell", SpreadsheetMlNs);
            writer.WriteAttributeString("ref", "A1:D1");
            writer.WriteEndElement();
            writer.WriteEndElement();

            int autoFiltroFin = Math.Max(finDatosFila, encabezadoFila);
            writer.WriteStartElement("autoFilter", SpreadsheetMlNs);
            writer.WriteAttributeString("ref", "A" + encabezadoFila + ":D" + autoFiltroFin.ToString(CultureInfo.InvariantCulture));
            writer.WriteEndElement();

            writer.WriteEndElement();
            writer.WriteEndDocument();
        }
    }

    private static void EscribirFilaTotal(XmlWriter writer, int fila, string etiqueta, int valor)
    {
        writer.WriteStartElement("row", SpreadsheetMlNs);
        writer.WriteAttributeString("r", fila.ToString(CultureInfo.InvariantCulture));
        EscribirCeldaTexto(writer, "A" + fila, etiqueta, 5);
        EscribirCeldaNumero(writer, "B" + fila, valor, 6);
        writer.WriteEndElement();
    }

    private static bool ContieneTextoIgnorandoMayusculas(List<string> items, string valor)
    {
        if (items == null || string.IsNullOrWhiteSpace(valor)) return false;

        string buscado = valor.Trim();
        for (int i = 0; i < items.Count; i += 1)
        {
            string actual = (items[i] ?? string.Empty).Trim();
            if (string.Equals(actual, buscado, StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }

        return false;
    }

    private static void EscribirColumna(XmlWriter writer, int min, int max, double width)
    {
        writer.WriteStartElement("col", SpreadsheetMlNs);
        writer.WriteAttributeString("min", min.ToString(CultureInfo.InvariantCulture));
        writer.WriteAttributeString("max", max.ToString(CultureInfo.InvariantCulture));
        writer.WriteAttributeString("width", width.ToString(CultureInfo.InvariantCulture));
        writer.WriteAttributeString("customWidth", "1");
        writer.WriteEndElement();
    }

    private static void EscribirCeldaTexto(XmlWriter writer, string referencia, string valor, uint styleIndex)
    {
        writer.WriteStartElement("c", SpreadsheetMlNs);
        writer.WriteAttributeString("r", referencia);
        writer.WriteAttributeString("s", styleIndex.ToString(CultureInfo.InvariantCulture));
        writer.WriteAttributeString("t", "inlineStr");
        writer.WriteStartElement("is", SpreadsheetMlNs);
        writer.WriteElementString("t", SpreadsheetMlNs, valor ?? string.Empty);
        writer.WriteEndElement();
        writer.WriteEndElement();
    }

    private static void EscribirCeldaNumero(XmlWriter writer, string referencia, decimal valor, uint styleIndex)
    {
        writer.WriteStartElement("c", SpreadsheetMlNs);
        writer.WriteAttributeString("r", referencia);
        writer.WriteAttributeString("s", styleIndex.ToString(CultureInfo.InvariantCulture));
        writer.WriteElementString("v", SpreadsheetMlNs, valor.ToString(CultureInfo.InvariantCulture));
        writer.WriteEndElement();
    }

    private static void EscribirCeldaNumero(XmlWriter writer, string referencia, int valor, uint styleIndex)
    {
        writer.WriteStartElement("c", SpreadsheetMlNs);
        writer.WriteAttributeString("r", referencia);
        writer.WriteAttributeString("s", styleIndex.ToString(CultureInfo.InvariantCulture));
        writer.WriteElementString("v", SpreadsheetMlNs, valor.ToString(CultureInfo.InvariantCulture));
        writer.WriteEndElement();
    }
}
