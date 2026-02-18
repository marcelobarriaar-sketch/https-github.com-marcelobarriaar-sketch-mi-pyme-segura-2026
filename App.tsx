import React, { useState, useEffect, createContext, useContext } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, useParams } from 'react-router-dom';
import {
  ShieldCheck,
  Menu,
  X,
  Settings,
  Lock,
  Key,
  LogOut,
  Phone,
  Save,
  CheckCircle,
  Star,
  Plus,
  AlertCircle,
  CloudDownload,
  Loader2,
  MessageCircle,
} from 'lucide-react';

import Home from './pages/Home';
import About from './pages/About';
import Equipment from './pages/Equipment';
import Projects from './pages/Projects';
import CreateProject from './pages/CreateProject';
import Contact from './pages/Contact';
import AdminDashboard from './pages/AdminDashboard';
import { SiteData, AdminState } from './types';

const RED_LOCK_LOGO =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAAB8klEQVR4nO2YvUoDQRSFv7NBEAsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsLCwsL/8A3vH8K6R0fXNoAAAAASUVORK5CYII=';

const INITIAL_DATA: SiteData = {
  branding: {
    siteName: 'Mi Pyme Segura',
    logoUrl: RED_LOCK_LOGO,
    primaryColor: '#E02424',
    secondaryColor: '#111827',
    textColor: '#1F2937',
    siteNameColor: '#000000',
    fontFamily: "'Inter', sans-serif",
    globalBackground: '#F9FAFB',

    // ✅ editable desde panel
    footerTagline: 'Líderes en seguridad inteligente para PYMES.',
  },
  whatsappConfig: {
    phoneNumber: '+56912345678',
    welcomeMessage: 'Hola Mi Pyme Segura, necesito asesoría.',
  },
  home: {
    heroTitle: 'SEGURIDAD INTELIGENTE PARA TU NEGOCIO',
    heroSubtitle:
      'Protegemos tu inversión con tecnología de vanguardia y sistemas autónomos diseñados para la realidad de hoy.',
    featuredImage: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1600',
    heroBgColor: '#111827',
    heroTextColor: '#FFFFFF',
  },
  about: {
    title: 'Sobre Mi Pyme Segura',
    content:
      'En Mi Pyme Segura llevamos más de una década dedicados a un propósito claro: proteger lo que más importa. Nacimos desde la realidad que nos rodea y desde el sur de Chile levantamos una propuesta seria, moderna y al alcance de todos.',
    mission: 'Proteger a personas, hogares y organizaciones mediante soluciones de seguridad inteligentes.',
    vision: 'Ser referentes en el sur de Chile en soluciones de seguridad inteligentes.',
    aboutImage: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&q=80&w=800',
    bgColor: '#FFFFFF',
    textColor: '#1F2937',
  },
  contact: {
    title: 'Hablemos de tu Seguridad',
    description:
      'Estamos listos para blindar tu negocio. Completa el formulario o utiliza cualquiera de nuestros canales directos.',
    phone: '+56912345678',
    email: 'hola@mipymesegura.cl',
    address: 'Av. Providencia 1234, Santiago',
    socials: [{ id: '1', name: 'Instagram', icon: 'Instagram', url: 'https://instagram.com' }],
    bgColor: '#F9FAFB',
    textColo
