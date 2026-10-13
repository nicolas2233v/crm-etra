'use client';
import {useState} from 'react';
import Link from 'next/link';
import {supabase} from '../../lib/supabase';
export default function Registro(){
 const[email,setEmail]=useState(''),[password,setPassword]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 async function submit(e:React.FormEvent){e.preventDefault();if(!supabase)return;setBusy(true);setMessage('');
 const{error}=await supabase.auth.signUp({email:email.trim().toLowerCase(),password,options:{emailRedirectTo:window.location.origin}});
 setBusy(false);setMessage(error?error.message:'Revisá tu correo para confirmar la cuenta. Después ingresá desde el inicio.');}
 return <main className="wrap" style={{maxWidth:430,paddingTop:55}}><div className="brand">ETRA CRM</div><h1>Activar mi acceso</h1><p className="muted">Solo para usuarios autorizados por ETRA. Usá tu correo de trabajo.</p><form className="card" onSubmit={submit}><label>Correo electrónico</label><input type="email" required value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email"/><label>Crear contraseña</label><input type="password" minLength={8} required value={password} onChange={e=>setPassword(e.target.value)} autoComplete="new-password"/><button className="btn" style={{width:'100%'}} disabled={busy}>Activar cuenta</button>{message&&<p role="status">{message}</p>}</form><Link href="/">Ya tengo cuenta · Ingresar</Link></main>;
}