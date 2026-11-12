using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Web.Script.Serialization;

public class RutinaEjecucion
{
    public long IdEjecucion { get; set; }
    public int IdSesionRutina { get; set; }
    public string FechaInicio { get; set; }
    public string FechaFin { get; set; }
    public RutinaEditorSesionDetalle Sesion { get; set; }
    public List<long> Completados { get; set; }
}
public static class RepositorioRutinasProgreso
{
    public static List<RutinaEjecucion> Obtener(int usuario, long asignacion)
    {
        List<RutinaEjecucion> items = new List<RutinaEjecucion>();
        using (SqlConnection c = DbHelper.GetConnection())
        using (SqlCommand q = new SqlCommand(@"SELECT TOP (100) p.IdEjecucion,p.IdSesionRutina,p.FechaInicio,p.FechaFin,p.PlanJson
FROM rut.ProgresoSesiones p JOIN rut.AsignacionesRutina a ON a.IdAsignacionRutina=p.IdAsignacionRutina
WHERE a.IdUsuario=@u AND a.IdAsignacionRutina=@a ORDER BY CASE WHEN p.FechaFin IS NULL THEN 0 ELSE 1 END,p.IdEjecucion DESC", c))
        {
            q.Parameters.AddWithValue("@u",usuario); q.Parameters.AddWithValue("@a",asignacion); c.Open();
            using (SqlDataReader r=q.ExecuteReader()) while(r.Read()) items.Add(new RutinaEjecucion {
                IdEjecucion=r.GetInt64(0),IdSesionRutina=r.GetInt32(1),FechaInicio=r.GetDateTime(2).ToString("yyyy-MM-ddTHH:mm:ssZ"),
                FechaFin=r.IsDBNull(3)?null:r.GetDateTime(3).ToString("yyyy-MM-ddTHH:mm:ssZ"),
                Sesion=new JavaScriptSerializer().Deserialize<RutinaEditorSesionDetalle>(r.GetString(4)),Completados=new List<long>() });
            foreach(RutinaEjecucion item in items)
            using(SqlCommand e=new SqlCommand("SELECT IdRutinaEjercicio FROM rut.ProgresoEjercicios WHERE IdEjecucion=@e AND Completado=1",c))
            {
                e.Parameters.AddWithValue("@e",item.IdEjecucion);
                using(SqlDataReader r=e.ExecuteReader()) while(r.Read()) item.Completados.Add(r.GetInt64(0));
            }
        }
        return items;
    }

    public static long Actualizar(int usuario,long asignacion,int sesion,long ejecucion,long ejercicio,string accion,bool completado,bool confirmar)
    {
        if(accion!="start" && accion!="toggle" && accion!="finish") throw new InvalidOperationException("Acción inválida.");
        using(SqlConnection c=DbHelper.GetConnection())
        {
            c.Open();
            using(SqlTransaction tx=c.BeginTransaction(IsolationLevel.Serializable))
            {
                int rutina;
                using(SqlCommand q=new SqlCommand(@"SELECT a.IdRutina FROM rut.AsignacionesRutina a WITH (UPDLOCK,HOLDLOCK)
JOIN rut.Rutinas r WITH (HOLDLOCK) ON r.IdRutina=a.IdRutina
WHERE a.IdAsignacionRutina=@a AND a.IdUsuario=@u AND a.Activa=1 AND r.Activa=1",c,tx))
                {
                    q.Parameters.AddWithValue("@a",asignacion);q.Parameters.AddWithValue("@u",usuario);
                    object found=q.ExecuteScalar(); if(found==null) throw new InvalidOperationException("La asignación no está disponible para tu usuario.");
                    rutina=Convert.ToInt32(found);
                }
                if(accion=="start")
                {
                    using(SqlCommand q=new SqlCommand("SELECT IdEjecucion FROM rut.ProgresoSesiones WITH (UPDLOCK,HOLDLOCK) WHERE IdAsignacionRutina=@a AND IdSesionRutina=@s AND FechaFin IS NULL",c,tx))
                    {
                        q.Parameters.AddWithValue("@a",asignacion);q.Parameters.AddWithValue("@s",sesion);
                        object existing=q.ExecuteScalar();if(existing!=null){tx.Commit();return Convert.ToInt64(existing);}
                    }
                    // The shared routine lock prevents edits while taking the session snapshot.
                    RutinaEditorDetalle plan=RepositorioRutinasEditor.ObtenerDetalleRutina(rutina);
                    RutinaEditorSesionDetalle selected=null;
                    if(plan!=null) foreach(RutinaEditorSesionDetalle s in plan.Sesiones) if(s.IdSesionRutina==sesion) selected=s;
                    if(selected==null || selected.Ejercicios.Count==0) throw new InvalidOperationException("La sesión no tiene ejercicios disponibles.");
                    using(SqlCommand q=new SqlCommand(@"INSERT rut.ProgresoSesiones(IdAsignacionRutina,IdSesionRutina,PlanJson) VALUES(@a,@s,@json);SELECT CAST(SCOPE_IDENTITY() AS BIGINT);",c,tx))
                    {
                        q.Parameters.AddWithValue("@a",asignacion);q.Parameters.AddWithValue("@s",sesion);
                        q.Parameters.AddWithValue("@json",new JavaScriptSerializer().Serialize(selected));ejecucion=Convert.ToInt64(q.ExecuteScalar());
                    }
                    foreach(RutinaEditorEjercicioDetalle ex in selected.Ejercicios)
                    using(SqlCommand q=new SqlCommand("INSERT rut.ProgresoEjercicios(IdEjecucion,IdRutinaEjercicio) VALUES(@e,@x)",c,tx))
                    {q.Parameters.AddWithValue("@e",ejecucion);q.Parameters.AddWithValue("@x",ex.IdRutinaEjercicio);q.ExecuteNonQuery();}
                }
                else
                {
                    using(SqlCommand q=new SqlCommand("SELECT COUNT(1) FROM rut.ProgresoSesiones WITH (UPDLOCK,HOLDLOCK) WHERE IdEjecucion=@e AND IdAsignacionRutina=@a AND FechaFin IS NULL",c,tx))
                    {
                        q.Parameters.AddWithValue("@e",ejecucion);q.Parameters.AddWithValue("@a",asignacion);
                        if(Convert.ToInt32(q.ExecuteScalar())!=1)throw new InvalidOperationException("La ejecución ya se cerró o no pertenece a esta asignación. Actualiza la vista.");
                    }
                    if(accion=="toggle")
                    using(SqlCommand q=new SqlCommand("UPDATE rut.ProgresoEjercicios SET Completado=@v WHERE IdEjecucion=@e AND IdRutinaEjercicio=@x",c,tx))
                    {
                        q.Parameters.AddWithValue("@v",completado);q.Parameters.AddWithValue("@e",ejecucion);q.Parameters.AddWithValue("@x",ejercicio);
                        if(q.ExecuteNonQuery()!=1)throw new InvalidOperationException("El ejercicio no pertenece a esta ejecución.");
                    }
                    else
                    {
                        using(SqlCommand q=new SqlCommand("SELECT COUNT(1) FROM rut.ProgresoEjercicios WHERE IdEjecucion=@e AND Completado=0",c,tx))
                        {
                            q.Parameters.AddWithValue("@e",ejecucion);
                            if(Convert.ToInt32(q.ExecuteScalar())>0 && !confirmar)throw new InvalidOperationException("Quedan ejercicios pendientes. Confirma para finalizar la sesión incompleta.");
                        }
                        using(SqlCommand q=new SqlCommand("UPDATE rut.ProgresoSesiones SET FechaFin=SYSUTCDATETIME() WHERE IdEjecucion=@e",c,tx))
                        {q.Parameters.AddWithValue("@e",ejecucion);q.ExecuteNonQuery();}
                    }
                }
                tx.Commit();return ejecucion;
            }
        }
    }
}
