'use client';
import {useState} from 'react';
import {supabase} from '../lib/supabase';
type Zone={id:string;name:string};
export default function ImportClients({zones,onDone}:{zones:Zone[];onDone:()=>Promise<void>}){
const [busy,setBusy]=useState(false),[result,setResult]=useState('');
async function upload(e:React.ChangeEvent<HTMLInputElement>){
 const file=e.target.files?.[0];if(!file||!supabase)return;setBusy(true);setResult('Procesando el archivo...');
 try{
  const XLSX=await import('xlsx');const book=XLSX.read(await file.arrayBuffer(),{type:'array'});const sheet=book.Sheets[book.SheetNames[0]];const rows=XLSX.utils.sheet_to_json<Record<string,string>>(sheet,{defval:'',raw:false});
  const clean=(value:string)=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
  const read=(row:Record<string,string>,names:string[])=>{const cols=Object.keys(row);const key=cols.find(k=>names.includes(clean(k)));return key?String(row[key]||'').trim():'';};
  const parsed=rows.map((r,i)=>{const zoneText=read(r,['zona']);const found=zones.find(z=>clean(z.name)===clean(zoneText));return{row:i+2,code:read(r,['codigocliente','codigo','codigodecliente']),business:read(r,['razonsocial','cliente','nombre']),address:read(r,['direccion','domicilio']),locality:read(r,['localidad','ciudad']),phone:read(r,['telefono','celular','telefonos']),businessType:read(r,['tipodeactividad','actividad','rubro']),zoneName:zoneText,zone_id:found?.id||null};});
  const errors=parsed.filter(p=>!p.code||!p.business||(p.zoneName&&!p.zone_id));
  if(!rows.length)throw new Error('El archivo está vacío.');
  if(errors.length)throw new Error('Revisar filas: '+errors.slice(0,12).map(p=>p.row+' ('+(!p.code?'sin código':!p.business?'sin razón social':'zona desconocida: '+p.zoneName)+')').join(', ')+(errors.length>12?'...':''));
  const unique=new Map(parsed.map(p=>[p.code,p]));
  const records=Array.from(unique.values()).map(p=>({client_code:p.code,business_name:p.business,address:p.address,locality:p.locality,phone:p.phone,business_type:p.businessType,zone_id:p.zone_id}));
  for(let i=0;i<records.length;i+=200){const{error}=await supabase.from('clients').upsert(records.slice(i,i+200),{onConflict:'client_code'});if(error)throw new Error(error.message);setResult('Importados '+Math.min(i+200,records.length)+' de '+records.length);}
  setResult('Listo: '+records.length+' clientes importados o actualizados, conservando actividades previas.');await onDone();
 }catch(err){setResult('No se importó completamente: '+(err instanceof Error?err.message:String(err)))}finally{setBusy(false);e.target.value='';}
}
return <section className="card"><h2>Importar clientes desde Excel</h2><p className="muted">Columnas: Codigo cliente, Razón social, Dirección, Localidad, Zona, Teléfono y Tipo de actividad. Actualiza por código sin borrar el historial.</p><label>Seleccionar archivo .xlsx o .xls</label><input type="file" accept=".xlsx,.xls" disabled={busy} onChange={upload}/>{result&&<p role="status">{result}</p>}</section>
}