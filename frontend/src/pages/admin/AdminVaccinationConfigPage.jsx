import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  Sliders, 
  Search, 
  Filter, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  Info, 
  Calendar, 
  Clock, 
  Layers, 
  Syringe, 
  FileText, 
  Activity, 
  RefreshCw, 
  Save, 
  Check, 
  ExternalLink,
  ChevronRight,
  AlertCircle,
  HelpCircle,
  Sparkles,
  GitBranch,
  Settings2
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { MetricCard } from '@/components/common/MetricCard';
import { LoadingState } from '@/components/common/LoadingState';
import { EmptyState } from '@/components/common/EmptyState';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { vaccinationApi } from '@/services/api';
import { useDemoMode } from '@/context/DemoModeContext';

// Comprehensive authoritative fallback catalog mirroring MoHFW NIS & IAP ACVIP guidelines
const AUTHORITATIVE_CATALOG_FALLBACK = [
  {
    code: 'BCG',
    vaccine_code: 'BCG',
    series_code: 'BCG',
    name: 'BCG (Bacillus Calmette–Guérin)',
    category: 'UNIVERSAL_NIS',
    dose_number: 1,
    dose_name: 'Birth Dose',
    recommended_age_display: 'At Birth (up to 1 year)',
    recommended_age_days: 0,
    minimum_age_days: 0,
    max_age_days: 365,
    minimum_interval_days: null,
    previous_dose_required: null,
    route: 'Intradermal',
    site: 'Left upper arm',
    dose_amount: '0.05 mL (<1 mo) / 0.1 mL (>1 mo)',
    target_disease: 'Tuberculosis (TB)',
    source_guideline: 'MoHFW National Immunization Schedule / UIP',
    can_catch_up: true,
    is_strictly_missed_past_window: false,
    grace_period_days: 28,
    clinical_review_notes: 'Can be given up to 1 year of age. If missed beyond 1 year, Mantoux test and clinical evaluation required under NTEP protocols.',
    notes: 'Single dose routine immunization. Produces classic BCG scar.'
  },
  {
    code: 'HEPB_BIRTH',
    vaccine_code: 'HEPB_BIRTH',
    series_code: 'HEPB',
    name: 'Hepatitis B (Birth Dose)',
    category: 'UNIVERSAL_NIS',
    dose_number: 1,
    dose_name: 'Birth Dose',
    recommended_age_display: 'At Birth (within 24 hours)',
    recommended_age_days: 0,
    minimum_age_days: 0,
    max_age_days: 1,
    minimum_interval_days: null,
    previous_dose_required: null,
    route: 'Intramuscular',
    site: 'Anterolateral mid-thigh, left',
    dose_amount: '0.5 mL',
    target_disease: 'Hepatitis B Virus (perinatal transmission)',
    source_guideline: 'MoHFW National Immunization Schedule / UIP',
    can_catch_up: false,
    is_strictly_missed_past_window: true,
    grace_period_days: 1,
    clinical_review_notes: 'Strict 24-hour window. If missed past 24 hours, birth dose is excluded; subsequent protection is achieved via Pentavalent-1/2/3.',
    notes: 'Crucial for preventing vertical transmission from HBsAg-positive mothers.'
  },
  {
    code: 'OPV_0',
    vaccine_code: 'OPV_0',
    series_code: 'OPV',
    name: 'Oral Polio Vaccine (OPV-0)',
    category: 'UNIVERSAL_NIS',
    dose_number: 1,
    dose_name: 'Zero Dose',
    recommended_age_display: 'At Birth (within 15 days)',
    recommended_age_days: 0,
    minimum_age_days: 0,
    max_age_days: 15,
    minimum_interval_days: null,
    previous_dose_required: null,
    route: 'Oral',
    site: 'Oral cavity',
    dose_amount: '2 drops',
    target_disease: 'Poliomyelitis (Polio)',
    source_guideline: 'MoHFW National Immunization Schedule / UIP',
    can_catch_up: false,
    is_strictly_missed_past_window: true,
    grace_period_days: 15,
    clinical_review_notes: 'Zero dose administered at birth or within first 15 days. If missed past 15 days, do not give zero dose; start routine series at 6 weeks with OPV-1.',
    notes: 'Provides mucosal gut immunity against wild polioviruses.'
  },
  {
    code: 'OPV_1',
    vaccine_code: 'OPV_1',
    series_code: 'OPV',
    name: 'Oral Polio Vaccine (OPV-1)',
    category: 'UNIVERSAL_NIS',
    dose_number: 2,
    dose_name: 'Dose 1',
    recommended_age_display: '6 Weeks',
    recommended_age_days: 42,
    minimum_age_days: 42,
    max_age_days: 1825,
    minimum_interval_days: 28,
    previous_dose_required: null,
    route: 'Oral',
    site: 'Oral cavity',
    dose_amount: '2 drops',
    target_disease: 'Poliomyelitis (Polio)',
    source_guideline: 'MoHFW National Immunization Schedule / UIP',
    can_catch_up: true,
    is_strictly_missed_past_window: false,
    grace_period_days: 28,
    clinical_review_notes: 'Administered at 6 weeks. Minimum interval between doses is 4 weeks.',
    notes: 'Primary series dose 1.'
  },
  {
    code: 'OPV_2',
    vaccine_code: 'OPV_2',
    series_code: 'OPV',
    name: 'Oral Polio Vaccine (OPV-2)',
    category: 'UNIVERSAL_NIS',
    dose_number: 3,
    dose_name: 'Dose 2',
    recommended_age_display: '10 Weeks',
    recommended_age_days: 70,
    minimum_age_days: 70,
    max_age_days: 1825,
    minimum_interval_days: 28,
    previous_dose_required: 'OPV_1',
    route: 'Oral',
    site: 'Oral cavity',
    dose_amount: '2 drops',
    target_disease: 'Poliomyelitis (Polio)',
    source_guideline: 'MoHFW National Immunization Schedule / UIP',
    can_catch_up: true,
    is_strictly_missed_past_window: false,
    grace_period_days: 28,
    clinical_review_notes: 'Requires OPV-1 with at least 4 weeks interval.',
    notes: 'Primary series dose 2.'
  },
  {
    code: 'OPV_3',
    vaccine_code: 'OPV_3',
    series_code: 'OPV',
    name: 'Oral Polio Vaccine (OPV-3)',
    category: 'UNIVERSAL_NIS',
    dose_number: 4,
    dose_name: 'Dose 3',
    recommended_age_display: '14 Weeks',
    recommended_age_days: 98,
    minimum_age_days: 98,
    max_age_days: 1825,
    minimum_interval_days: 28,
    previous_dose_required: 'OPV_2',
    route: 'Oral',
    site: 'Oral cavity',
    dose_amount: '2 drops',
    target_disease: 'Poliomyelitis (Polio)',
    source_guideline: 'MoHFW National Immunization Schedule / UIP',
    can_catch_up: true,
    is_strictly_missed_past_window: false,
    grace_period_days: 28,
    clinical_review_notes: 'Requires OPV-2 with at least 4 weeks interval.',
    notes: 'Primary series dose 3.'
  },
  {
    code: 'PENTAVALENT_1',
    vaccine_code: 'PENTAVALENT_1',
    series_code: 'PENTAVALENT',
    name: 'Pentavalent Vaccine (Dose 1)',
    category: 'UNIVERSAL_NIS',
    dose_number: 1,
    dose_name: 'Dose 1',
    recommended_age_display: '6 Weeks',
    recommended_age_days: 42,
    minimum_age_days: 42,
    max_age_days: 365,
    minimum_interval_days: null,
    previous_dose_required: null,
    route: 'Intramuscular',
    site: 'Anterolateral mid-thigh, left',
    dose_amount: '0.5 mL',
    target_disease: 'Diphtheria, Pertussis, Tetanus, Hepatitis B, Hib',
    source_guideline: 'MoHFW National Immunization Schedule / UIP',
    can_catch_up: true,
    is_strictly_missed_past_window: false,
    grace_period_days: 28,
    clinical_review_notes: 'Can be initiated up to 1 year. Minimum 4 weeks between doses.',
    notes: '5-in-1 combination conjugate vaccine replacing DTwP, HepB, and Hib single shots.'
  },
  {
    code: 'PENTAVALENT_2',
    vaccine_code: 'PENTAVALENT_2',
    series_code: 'PENTAVALENT',
    name: 'Pentavalent Vaccine (Dose 2)',
    category: 'UNIVERSAL_NIS',
    dose_number: 2,
    dose_name: 'Dose 2',
    recommended_age_display: '10 Weeks',
    recommended_age_days: 70,
    minimum_age_days: 70,
    max_age_days: 365,
    minimum_interval_days: 28,
    previous_dose_required: 'PENTAVALENT_1',
    route: 'Intramuscular',
    site: 'Anterolateral mid-thigh, left',
    dose_amount: '0.5 mL',
    target_disease: 'Diphtheria, Pertussis, Tetanus, Hepatitis B, Hib',
    source_guideline: 'MoHFW National Immunization Schedule / UIP',
    can_catch_up: true,
    is_strictly_missed_past_window: false,
    grace_period_days: 28,
    clinical_review_notes: 'Requires Pentavalent-1 with at least 4 weeks interval.',
    notes: 'Primary 5-in-1 series dose 2.'
  },
  {
    code: 'PENTAVALENT_3',
    vaccine_code: 'PENTAVALENT_3',
    series_code: 'PENTAVALENT',
    name: 'Pentavalent Vaccine (Dose 3)',
    category: 'UNIVERSAL_NIS',
    dose_number: 3,
    dose_name: 'Dose 3',
    recommended_age_display: '14 Weeks',
    recommended_age_days: 98,
    minimum_age_days: 98,
    max_age_days: 365,
    minimum_interval_days: 28,
    previous_dose_required: 'PENTAVALENT_2',
    route: 'Intramuscular',
    site: 'Anterolateral mid-thigh, left',
    dose_amount: '0.5 mL',
    target_disease: 'Diphtheria, Pertussis, Tetanus, Hepatitis B, Hib',
    source_guideline: 'MoHFW National Immunization Schedule / UIP',
    can_catch_up: true,
    is_strictly_missed_past_window: false,
    grace_period_days: 28,
    clinical_review_notes: 'Completes primary Pentavalent series. Prerequisite for DPT Booster 1.',
    notes: 'Primary 5-in-1 series completion.'
  },
  {
    code: 'ROTA_1',
    vaccine_code: 'ROTA_1',
    series_code: 'ROTAVIRUS',
    name: 'Rotavirus Vaccine (RVV-1)',
    category: 'UNIVERSAL_NIS',
    dose_number: 1,
    dose_name: 'Dose 1',
    recommended_age_display: '6 Weeks',
    recommended_age_days: 42,
    minimum_age_days: 42,
    max_age_days: 365,
    minimum_interval_days: null,
    previous_dose_required: null,
    route: 'Oral',
    site: 'Oral cavity',
    dose_amount: '5 drops (liquid) / 2.5 mL',
    target_disease: 'Rotavirus Severe Diarrhea',
    source_guideline: 'MoHFW National Immunization Schedule / UIP',
    can_catch_up: true,
    is_strictly_missed_past_window: false,
    grace_period_days: 28,
    clinical_review_notes: 'Under NIS, should not be initiated beyond 1 year due to intussusception safety profiles.',
    notes: 'Live attenuated oral vaccine against infantile gastroenteritis.'
  },
  {
    code: 'ROTA_2',
    vaccine_code: 'ROTA_2',
    series_code: 'ROTAVIRUS',
    name: 'Rotavirus Vaccine (RVV-2)',
    category: 'UNIVERSAL_NIS',
    dose_number: 2,
    dose_name: 'Dose 2',
    recommended_age_display: '10 Weeks',
    recommended_age_days: 70,
    minimum_age_days: 70,
    max_age_days: 365,
    minimum_interval_days: 28,
    previous_dose_required: 'ROTA_1',
    route: 'Oral',
    site: 'Oral cavity',
    dose_amount: '5 drops',
    target_disease: 'Rotavirus Severe Diarrhea',
    source_guideline: 'MoHFW National Immunization Schedule / UIP',
    can_catch_up: true,
    is_strictly_missed_past_window: false,
    grace_period_days: 28,
    clinical_review_notes: 'Requires RVV-1 with at least 4 weeks interval.',
    notes: 'Second dose of oral rotavirus.'
  },
  {
    code: 'ROTA_3',
    vaccine_code: 'ROTA_3',
    series_code: 'ROTAVIRUS',
    name: 'Rotavirus Vaccine (RVV-3)',
    category: 'UNIVERSAL_NIS',
    dose_number: 3,
    dose_name: 'Dose 3',
    recommended_age_display: '14 Weeks',
    recommended_age_days: 98,
    minimum_age_days: 98,
    max_age_days: 365,
    minimum_interval_days: 28,
    previous_dose_required: 'ROTA_2',
    route: 'Oral',
    site: 'Oral cavity',
    dose_amount: '5 drops',
    target_disease: 'Rotavirus Severe Diarrhea',
    source_guideline: 'MoHFW National Immunization Schedule / UIP',
    can_catch_up: true,
    is_strictly_missed_past_window: false,
    grace_period_days: 28,
    clinical_review_notes: 'Completes NIS rotavirus schedule.',
    notes: 'Final rotavirus series dose.'
  },
  {
    code: 'FIPV_1',
    vaccine_code: 'FIPV_1',
    series_code: 'FIPV',
    name: 'Fractional Inactivated Polio Vaccine (fIPV-1)',
    category: 'UNIVERSAL_NIS',
    dose_number: 1,
    dose_name: 'Dose 1',
    recommended_age_display: '6 Weeks',
    recommended_age_days: 42,
    minimum_age_days: 42,
    max_age_days: 365,
    minimum_interval_days: null,
    previous_dose_required: null,
    route: 'Intradermal',
    site: 'Right upper arm',
    dose_amount: '0.1 mL (fractional dose)',
    target_disease: 'Poliomyelitis (Types 1, 2, 3)',
    source_guideline: 'MoHFW National Immunization Schedule / UIP',
    can_catch_up: true,
    is_strictly_missed_past_window: false,
    grace_period_days: 28,
    clinical_review_notes: 'Fractional intradermal dose provides robust humoral immunity and prevents VDPV transmission.',
    notes: 'Administered at 6 weeks and 14 weeks intradermally.'
  },
  {
    code: 'FIPV_2',
    vaccine_code: 'FIPV_2',
    series_code: 'FIPV',
    name: 'Fractional Inactivated Polio Vaccine (fIPV-2)',
    category: 'UNIVERSAL_NIS',
    dose_number: 2,
    dose_name: 'Dose 2',
    recommended_age_display: '14 Weeks',
    recommended_age_days: 98,
    minimum_age_days: 98,
    max_age_days: 365,
    minimum_interval_days: 56,
    previous_dose_required: 'FIPV_1',
    route: 'Intradermal',
    site: 'Right upper arm',
    dose_amount: '0.1 mL',
    target_disease: 'Poliomyelitis (Types 1, 2, 3)',
    source_guideline: 'MoHFW National Immunization Schedule / UIP',
    can_catch_up: true,
    is_strictly_missed_past_window: false,
    grace_period_days: 28,
    clinical_review_notes: 'Requires at least 8 weeks interval after fIPV-1.',
    notes: 'Completes infant primary injectable polio protection.'
  },
  {
    code: 'PCV_1',
    vaccine_code: 'PCV_1',
    series_code: 'PCV',
    name: 'Pneumococcal Conjugate Vaccine (PCV-1)',
    category: 'UNIVERSAL_NIS',
    dose_number: 1,
    dose_name: 'Dose 1',
    recommended_age_display: '6 Weeks',
    recommended_age_days: 42,
    minimum_age_days: 42,
    max_age_days: 365,
    minimum_interval_days: null,
    previous_dose_required: null,
    route: 'Intramuscular',
    site: 'Anterolateral mid-thigh, right',
    dose_amount: '0.5 mL',
    target_disease: 'Streptococcus pneumoniae (Pneumonia & Sepsis)',
    source_guideline: 'MoHFW National Immunization Schedule / UIP',
    can_catch_up: true,
    is_strictly_missed_past_window: false,
    grace_period_days: 28,
    clinical_review_notes: 'Routine UIP 2+1 schedule. Protects against invasive pneumococcal disease.',
    notes: 'Dose 1 at 6 weeks.'
  },
  {
    code: 'PCV_2',
    vaccine_code: 'PCV_2',
    series_code: 'PCV',
    name: 'Pneumococcal Conjugate Vaccine (PCV-2)',
    category: 'UNIVERSAL_NIS',
    dose_number: 2,
    dose_name: 'Dose 2',
    recommended_age_display: '14 Weeks',
    recommended_age_days: 98,
    minimum_age_days: 98,
    max_age_days: 365,
    minimum_interval_days: 56,
    previous_dose_required: 'PCV_1',
    route: 'Intramuscular',
    site: 'Anterolateral mid-thigh, right',
    dose_amount: '0.5 mL',
    target_disease: 'Streptococcus pneumoniae (Pneumonia & Sepsis)',
    source_guideline: 'MoHFW National Immunization Schedule / UIP',
    can_catch_up: true,
    is_strictly_missed_past_window: false,
    grace_period_days: 28,
    clinical_review_notes: 'Requires at least 8 weeks interval after PCV-1.',
    notes: 'Primary infant dose 2.'
  },
  {
    code: 'PCV_BOOSTER',
    vaccine_code: 'PCV_BOOSTER',
    series_code: 'PCV',
    name: 'Pneumococcal Conjugate Vaccine (PCV Booster)',
    category: 'UNIVERSAL_NIS',
    dose_number: 3,
    dose_name: 'Booster',
    recommended_age_display: '9 Months (9-12 Months)',
    recommended_age_days: 274,
    minimum_age_days: 274,
    max_age_days: 730,
    minimum_interval_days: 120,
    previous_dose_required: 'PCV_2',
    route: 'Intramuscular',
    site: 'Anterolateral mid-thigh, right',
    dose_amount: '0.5 mL',
    target_disease: 'Streptococcus pneumoniae (Pneumonia & Sepsis)',
    source_guideline: 'MoHFW National Immunization Schedule / UIP',
    can_catch_up: true,
    is_strictly_missed_past_window: false,
    grace_period_days: 60,
    clinical_review_notes: 'Booster dose administered between 9-12 months. Requires completion of PCV-1 & PCV-2.',
    notes: 'Establishes long-term immunological memory.'
  },
  {
    code: 'MR_1',
    vaccine_code: 'MR_1',
    series_code: 'MR',
    name: 'Measles-Rubella Vaccine (MR-1)',
    category: 'UNIVERSAL_NIS',
    dose_number: 1,
    dose_name: 'Dose 1',
    recommended_age_display: '9 Months (9-12 Months)',
    recommended_age_days: 274,
    minimum_age_days: 274,
    max_age_days: 1825,
    minimum_interval_days: null,
    previous_dose_required: null,
    route: 'Subcutaneous',
    site: 'Right upper arm',
    dose_amount: '0.5 mL',
    target_disease: 'Measles & Rubella (Congenital Rubella Syndrome)',
    source_guideline: 'MoHFW National Immunization Schedule / UIP',
    can_catch_up: true,
    is_strictly_missed_past_window: false,
    grace_period_days: 60,
    clinical_review_notes: 'Co-administered with Vitamin A (100,000 IU). Essential for elimination of measles and CRS.',
    notes: 'Replaces monovalent measles vaccine under universal program.'
  },
  {
    code: 'MR_2',
    vaccine_code: 'MR_2',
    series_code: 'MR',
    name: 'Measles-Rubella Vaccine (MR-2)',
    category: 'UNIVERSAL_NIS',
    dose_number: 2,
    dose_name: 'Dose 2',
    recommended_age_display: '16-24 Months',
    recommended_age_days: 486,
    minimum_age_days: 486,
    max_age_days: 1825,
    minimum_interval_days: 28,
    previous_dose_required: 'MR_1',
    route: 'Subcutaneous',
    site: 'Right upper arm',
    dose_amount: '0.5 mL',
    target_disease: 'Measles & Rubella',
    source_guideline: 'MoHFW National Immunization Schedule / UIP',
    can_catch_up: true,
    is_strictly_missed_past_window: false,
    grace_period_days: 90,
    clinical_review_notes: 'Requires at least 4 weeks interval after MR-1.',
    notes: 'Second dose required to ensure seroconversion in primary non-responders.'
  },
  {
    code: 'JE_1',
    vaccine_code: 'JE_1',
    series_code: 'JE',
    name: 'Japanese Encephalitis Vaccine (JE-1)',
    category: 'CONDITIONAL_NIS',
    dose_number: 1,
    dose_name: 'Dose 1',
    recommended_age_display: '9 Months (Endemic Districts)',
    recommended_age_days: 274,
    minimum_age_days: 274,
    max_age_days: 5475,
    minimum_interval_days: null,
    previous_dose_required: null,
    route: 'Subcutaneous',
    site: 'Left upper arm',
    dose_amount: '0.5 mL',
    target_disease: 'Japanese Encephalitis Virus (Brain Fever)',
    source_guideline: 'MoHFW National Immunization Schedule (Designated Endemic Districts)',
    can_catch_up: true,
    is_strictly_missed_past_window: false,
    grace_period_days: 60,
    clinical_review_notes: 'Conditional: Mandated only in 231 MoHFW-designated endemic districts (e.g. Gorakhpur, Bellary, Malkangiri).',
    notes: 'Live attenuated SA-14-14-2 vaccine.'
  },
  {
    code: 'JE_2',
    vaccine_code: 'JE_2',
    series_code: 'JE',
    name: 'Japanese Encephalitis Vaccine (JE-2)',
    category: 'CONDITIONAL_NIS',
    dose_number: 2,
    dose_name: 'Dose 2',
    recommended_age_display: '16-24 Months (Endemic Districts)',
    recommended_age_days: 486,
    minimum_age_days: 486,
    max_age_days: 5475,
    minimum_interval_days: 180,
    previous_dose_required: 'JE_1',
    route: 'Subcutaneous',
    site: 'Left upper arm',
    dose_amount: '0.5 mL',
    target_disease: 'Japanese Encephalitis Virus',
    source_guideline: 'MoHFW National Immunization Schedule (Designated Endemic Districts)',
    can_catch_up: true,
    is_strictly_missed_past_window: false,
    grace_period_days: 90,
    clinical_review_notes: 'Requires at least 6 months interval after JE-1.',
    notes: 'Second dose confers durable protection against seasonal epidemics.'
  },
  {
    code: 'DPT_B1',
    vaccine_code: 'DPT_B1',
    series_code: 'DPT',
    name: 'DPT Booster 1',
    category: 'UNIVERSAL_NIS',
    dose_number: 1,
    dose_name: 'Booster 1',
    recommended_age_display: '16-24 Months',
    recommended_age_days: 486,
    minimum_age_days: 486,
    max_age_days: 2555,
    minimum_interval_days: 180,
    previous_dose_required: 'PENTAVALENT_3',
    route: 'Intramuscular',
    site: 'Anterolateral mid-thigh, left',
    dose_amount: '0.5 mL',
    target_disease: 'Diphtheria, Pertussis, Tetanus',
    source_guideline: 'MoHFW National Immunization Schedule / UIP',
    can_catch_up: true,
    is_strictly_missed_past_window: false,
    grace_period_days: 90,
    clinical_review_notes: 'Requires completion of primary Pentavalent series with at least 6 months elapsed since Pentavalent-3.',
    notes: 'First booster restores waning maternal/infant pertussis antibodies.'
  },
  {
    code: 'DPT_B2',
    vaccine_code: 'DPT_B2',
    series_code: 'DPT',
    name: 'DPT Booster 2',
    category: 'UNIVERSAL_NIS',
    dose_number: 2,
    dose_name: 'Booster 2',
    recommended_age_display: '5-6 Years',
    recommended_age_days: 1825,
    minimum_age_days: 1825,
    max_age_days: 2555,
    minimum_interval_days: 365,
    previous_dose_required: 'DPT_B1',
    route: 'Intramuscular',
    site: 'Upper arm (Deltoid)',
    dose_amount: '0.5 mL',
    target_disease: 'Diphtheria, Pertussis, Tetanus',
    source_guideline: 'MoHFW National Immunization Schedule / UIP',
    can_catch_up: true,
    is_strictly_missed_past_window: false,
    grace_period_days: 180,
    clinical_review_notes: 'Given between 5-6 years. Cannot be given after 7 years of age (substitute with Td).',
    notes: 'School entry immunization.'
  },
  {
    code: 'TD_10Y',
    vaccine_code: 'TD_10Y',
    series_code: 'TD',
    name: 'Tetanus & adult Diphtheria (Td 10 Years)',
    category: 'UNIVERSAL_NIS',
    dose_number: 1,
    dose_name: '10 Years Booster',
    recommended_age_display: '10 Years',
    recommended_age_days: 3650,
    minimum_age_days: 3650,
    max_age_days: 5840,
    minimum_interval_days: null,
    previous_dose_required: null,
    route: 'Intramuscular',
    site: 'Upper arm (Deltoid)',
    dose_amount: '0.5 mL',
    target_disease: 'Tetanus & Diphtheria',
    source_guideline: 'MoHFW National Immunization Schedule / UIP',
    can_catch_up: true,
    is_strictly_missed_past_window: false,
    grace_period_days: 180,
    clinical_review_notes: 'Replaces TT under revised UIP to maintain diphtheria immunity in school-aged children.',
    notes: 'Reduced-dose diphtheria toxoid formulation safe for older children.'
  },
  {
    code: 'TD_16Y',
    vaccine_code: 'TD_16Y',
    series_code: 'TD',
    name: 'Tetanus & adult Diphtheria (Td 16 Years)',
    category: 'UNIVERSAL_NIS',
    dose_number: 2,
    dose_name: '16 Years Booster',
    recommended_age_display: '16 Years',
    recommended_age_days: 5840,
    minimum_age_days: 5840,
    max_age_days: 6570,
    minimum_interval_days: 1825,
    previous_dose_required: 'TD_10Y',
    route: 'Intramuscular',
    site: 'Upper arm (Deltoid)',
    dose_amount: '0.5 mL',
    target_disease: 'Tetanus & Diphtheria',
    source_guideline: 'MoHFW National Immunization Schedule / UIP',
    can_catch_up: true,
    is_strictly_missed_past_window: false,
    grace_period_days: 180,
    clinical_review_notes: 'Final adolescent routine booster under UIP.',
    notes: 'Protects adolescent against maternal/neonatal tetanus risks in early adulthood.'
  },
  {
    code: 'MMR_1',
    vaccine_code: 'MMR_1',
    series_code: 'MMR',
    name: 'MMR Vaccine (Measles, Mumps, Rubella)',
    category: 'PRIVATE_OPTIONAL',
    dose_number: 1,
    dose_name: 'Dose 1',
    recommended_age_display: '9 Months / 12 Months',
    recommended_age_days: 365,
    minimum_age_days: 274,
    max_age_days: 6570,
    minimum_interval_days: null,
    previous_dose_required: null,
    route: 'Subcutaneous',
    site: 'Upper arm (Deltoid)',
    dose_amount: '0.5 mL',
    target_disease: 'Measles, Mumps, Rubella',
    source_guideline: 'Indian Academy of Pediatrics (IAP) ACVIP Guideline',
    can_catch_up: true,
    is_strictly_missed_past_window: false,
    grace_period_days: 60,
    clinical_review_notes: 'Private/IAP optional recommendation incorporating Mumps coverage not covered by routine UIP MR vaccine.',
    notes: 'Triple live viral vaccine.'
  },
  {
    code: 'VARICELLA_1',
    vaccine_code: 'VARICELLA_1',
    series_code: 'VARICELLA',
    name: 'Varicella (Chickenpox Dose 1)',
    category: 'PRIVATE_OPTIONAL',
    dose_number: 1,
    dose_name: 'Dose 1',
    recommended_age_display: '15 Months',
    recommended_age_days: 456,
    minimum_age_days: 365,
    max_age_days: 6570,
    minimum_interval_days: null,
    previous_dose_required: null,
    route: 'Subcutaneous',
    site: 'Upper arm (Deltoid)',
    dose_amount: '0.5 mL',
    target_disease: 'Varicella Zoster (Chickenpox)',
    source_guideline: 'Indian Academy of Pediatrics (IAP) ACVIP Guideline',
    can_catch_up: true,
    is_strictly_missed_past_window: false,
    grace_period_days: 90,
    clinical_review_notes: 'Requires 2 doses spaced by at least 3 months for long-lasting protection against chickenpox.',
    notes: 'Live attenuated Oka strain vaccine.'
  },
  {
    code: 'TYPHOID_CONJUGATE',
    vaccine_code: 'TCV',
    series_code: 'TCV',
    name: 'Typhoid Conjugate Vaccine (TCV)',
    category: 'PRIVATE_OPTIONAL',
    dose_number: 1,
    dose_name: 'Primary Dose',
    recommended_age_display: '6-9 Months',
    recommended_age_days: 274,
    minimum_age_days: 180,
    max_age_days: 16425,
    minimum_interval_days: null,
    previous_dose_required: null,
    route: 'Intramuscular',
    site: 'Anterolateral mid-thigh / Deltoid',
    dose_amount: '0.5 mL',
    target_disease: 'Salmonella enterica serovar Typhi (Enteric Fever)',
    source_guideline: 'Indian Academy of Pediatrics (IAP) ACVIP Guideline',
    can_catch_up: true,
    is_strictly_missed_past_window: false,
    grace_period_days: 90,
    clinical_review_notes: 'Conjugate formulation provides T-cell dependent long-term immunity in children >6 months.',
    notes: 'Single shot provides high efficacy against multidrug-resistant typhoid strains.'
  },
  {
    code: 'HEPA_1',
    vaccine_code: 'HEPA_1',
    series_code: 'HEPA',
    name: 'Hepatitis A Vaccine (Dose 1)',
    category: 'PRIVATE_OPTIONAL',
    dose_number: 1,
    dose_name: 'Dose 1',
    recommended_age_display: '12 Months',
    recommended_age_days: 365,
    minimum_age_days: 365,
    max_age_days: 16425,
    minimum_interval_days: null,
    previous_dose_required: null,
    route: 'Intramuscular',
    site: 'Upper arm (Deltoid)',
    dose_amount: '0.5 mL',
    target_disease: 'Hepatitis A Virus (Acute Liver Inflammation)',
    source_guideline: 'Indian Academy of Pediatrics (IAP) ACVIP Guideline',
    can_catch_up: true,
    is_strictly_missed_past_window: false,
    grace_period_days: 90,
    clinical_review_notes: 'Available as inactivated (2-dose series) or live attenuated (single-dose) formulation.',
    notes: 'Protects against foodborne/waterborne viral hepatitis.'
  },
  {
    code: 'HPV_1',
    vaccine_code: 'HPV_1',
    series_code: 'HPV',
    name: 'Human Papillomavirus Vaccine (HPV-1)',
    category: 'PRIVATE_OPTIONAL',
    dose_number: 1,
    dose_name: 'Dose 1',
    recommended_age_display: '9-14 Years (Adolescent Girls)',
    recommended_age_days: 3650,
    minimum_age_days: 3285,
    max_age_days: 9490,
    minimum_interval_days: null,
    previous_dose_required: null,
    route: 'Intramuscular',
    site: 'Upper arm (Deltoid)',
    dose_amount: '0.5 mL',
    target_disease: 'Human Papillomavirus (Cervical Cancer Types 16, 18)',
    source_guideline: 'WHO SAGE & IAP ACVIP Guidelines',
    can_catch_up: true,
    is_strictly_missed_past_window: false,
    grace_period_days: 180,
    clinical_review_notes: '2-dose schedule (0, 6 months) for girls aged 9-14; 3 doses for ages 15+. Protects against cervical cancer.',
    notes: 'Recombinant bivalent, quadrivalent, or nonavalent vaccine.'
  }
];

export function AdminVaccinationConfigPage() {
  const { isDemoMode } = useDemoMode();
  const [catalog, setCatalog] = useState(AUTHORITATIVE_CATALOG_FALLBACK);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [programFilter, setProgramFilter] = useState('ALL');
  const [ageFilter, setAgeFilter] = useState('ALL');
  const [selectedVaccine, setSelectedVaccine] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(null);

  // Operational Settings State (persisted to localStorage)
  const [operationalSettings, setOperationalSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('vaxassist_admin_vax_config');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not read saved vaccination config:', e);
    }
    return {
      universalUIPEnabled: true,
      jeEndemicAutoDetection: true,
      privateIAPDualSchedule: true,
      defaultGracePeriodDays: 28,
      advanceReminderLeadDays: [14, 7, 3, 1],
      defaulterEscalationThresholdDays: 30,
      coldChainDeviationAlertTempC: 8.0,
      lastUpdated: new Date().toISOString(),
      updatedBy: 'admin@vaxassist.demo',
    };
  });

  const [savingSettings, setSavingSettings] = useState(false);

  // Load catalog from backend
  const fetchCatalogData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await vaccinationApi.getCatalog();
      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
        setCatalog(res.data);
      } else {
        setCatalog(AUTHORITATIVE_CATALOG_FALLBACK);
      }
    } catch (err) {
      console.warn('Using authoritative local catalog fallback:', err);
      setCatalog(AUTHORITATIVE_CATALOG_FALLBACK);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCatalogData();
  }, [fetchCatalogData]);

  // Catalog Metrics
  const metrics = useMemo(() => {
    const totalDoses = catalog.length;
    const universalCount = catalog.filter((v) => v.category === 'UNIVERSAL_NIS').length;
    const conditionalCount = catalog.filter((v) => v.category === 'CONDITIONAL_NIS').length;
    const privateCount = catalog.filter((v) => v.category === 'PRIVATE_OPTIONAL').length;
    return { totalDoses, universalCount, conditionalCount, privateCount };
  }, [catalog]);

  // Filtered Catalog
  const filteredCatalog = useMemo(() => {
    return catalog.filter((v) => {
      // Program category filter
      if (programFilter !== 'ALL' && v.category !== programFilter) return false;

      // Age bracket filter
      if (ageFilter === 'BIRTH' && v.recommended_age_days !== 0) return false;
      if (ageFilter === 'INFANCY' && (v.recommended_age_days <= 0 || v.recommended_age_days > 365)) return false;
      if (ageFilter === 'TODDLER' && (v.recommended_age_days <= 365 || v.recommended_age_days > 730)) return false;
      if (ageFilter === 'CHILDHOOD' && (v.recommended_age_days <= 730 || v.recommended_age_days > 3650)) return false;
      if (ageFilter === 'ADOLESCENT' && v.recommended_age_days < 3650) return false;

      // Search query (code, name, target disease, guidelines)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesCode = v.code?.toLowerCase().includes(query) || v.vaccine_code?.toLowerCase().includes(query);
        const matchesName = v.name?.toLowerCase().includes(query) || v.full_name?.toLowerCase().includes(query);
        const matchesDisease = v.target_disease?.toLowerCase().includes(query);
        const matchesGuideline = v.source_guideline?.toLowerCase().includes(query);
        if (!matchesCode && !matchesName && !matchesDisease && !matchesGuideline) return false;
      }

      return true;
    });
  }, [catalog, programFilter, ageFilter, searchQuery]);

  const handleOpenDetail = (vaccine) => {
    setSelectedVaccine(vaccine);
    setDetailModalOpen(true);
  };

  const handleSaveOperationalSettings = (e) => {
    e.preventDefault();
    setSavingSettings(true);
    setTimeout(() => {
      const updated = {
        ...operationalSettings,
        lastUpdated: new Date().toISOString(),
        updatedBy: 'admin@vaxassist.demo',
      };
      setOperationalSettings(updated);
      try {
        localStorage.setItem('vaxassist_admin_vax_config', JSON.stringify(updated));
      } catch (err) {
        console.error(err);
      }
      setSavingSettings(false);
      setSaveSuccessNotice('Operational vaccination parameters and reminder cascades successfully persisted.');
      setTimeout(() => setSaveSuccessNotice(null), 4000);
    }, 400);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Vaccination Configuration & Rules"
        subtitle="Authoritative schedule matrix, dose dependencies, temporal constraints, and clinical validation rules."
        breadcrumbs={[
          { label: 'Admin Dashboard', href: '/admin/dashboard' },
          { label: 'Vaccination Configuration' },
        ]}
        badgeText="Deterministic Engine"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={fetchCatalogData}
            disabled={loading}
            className="gap-1.5 h-9"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Catalog</span>
          </Button>
        }
      />

      {/* Mandatory Statutory Clinical Safety Banner */}
      <Alert className="border-primary/30 bg-primary/5 text-foreground">
        <ShieldCheck className="h-5 w-5 text-primary" />
        <AlertTitle className="text-sm font-bold flex items-center gap-2">
          <span>Immutable Clinical Engine — Zero-LLM Mandate</span>
          <Badge variant="outline" className="border-primary/40 text-primary font-mono text-[10px]">
            LOCKED ARITHMETIC
          </Badge>
        </AlertTitle>
        <AlertDescription className="text-xs text-muted-foreground mt-1 leading-relaxed">
          In strict compliance with <strong>Ministry of Health & Family Welfare (MoHFW) UIP</strong> and <strong>WHO India</strong> guidelines, 
          vaccination intervals, due dates, and minimum age boundaries are evaluated using <strong>deterministic arithmetic engines only</strong>. 
          Large Language Models (LLMs) are restricted exclusively to natural language advisory and knowledge queries and are strictly forbidden 
          from calculating or overriding clinical schedules.
        </AlertDescription>
      </Alert>

      {/* Save Success Notice */}
      {saveSuccessNotice && (
        <Alert className="border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <AlertTitle className="text-xs font-bold">Success</AlertTitle>
          <AlertDescription className="text-xs">{saveSuccessNotice}</AlertDescription>
        </Alert>
      )}

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Catalog Doses"
          value={metrics.totalDoses}
          subtext="Standardized clinical regimens"
          icon={Syringe}
          trend={{ value: '100% NIS & IAP mapped', positive: true }}
        />
        <MetricCard
          title="Universal UIP (Free NIS)"
          value={metrics.universalCount}
          subtext="Routine government immunization"
          icon={ShieldCheck}
          badgeText="Public Facilities"
        />
        <MetricCard
          title="Endemic NIS (JE)"
          value={metrics.conditionalCount}
          subtext="Japanese Encephalitis regions"
          icon={AlertTriangle}
          badgeText="Conditional Districts"
        />
        <MetricCard
          title="Private / IAP Regimens"
          value={metrics.privateCount}
          subtext="Non-NIS optional guidelines"
          icon={Layers}
          badgeText="ACVIP Guideline"
        />
      </div>

      {/* Main Tabs Navigation */}
      <Tabs defaultValue="catalog" className="space-y-6">
        <TabsList className="grid grid-cols-3 w-full max-w-xl h-10">
          <TabsTrigger value="catalog" className="text-xs gap-1.5">
            <Syringe className="h-3.5 w-3.5" />
            <span>Vaccine Catalog</span>
          </TabsTrigger>
          <TabsTrigger value="engine" className="text-xs gap-1.5">
            <GitBranch className="h-3.5 w-3.5" />
            <span>Rules & Dependencies</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="text-xs gap-1.5">
            <Settings2 className="h-3.5 w-3.5" />
            <span>Operational Controls</span>
          </TabsTrigger>
        </TabsList>

        {/* ========================================================================= */}
        {/* TAB 1: VACCINE CATALOG & DOSE MATRIX */}
        {/* ========================================================================= */}
        <TabsContent value="catalog" className="space-y-4">
          <Card className="border border-border">
            <CardHeader className="p-4 sm:p-5 border-b border-border bg-card">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-bold">Vaccine Formulations & Schedule Rules</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Inspect standard due ages, minimum intervals, routes, and clinical validation guidelines.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                  <span>Showing {filteredCatalog.length} of {catalog.length} regimens</span>
                </div>
              </div>

              {/* Filters Bar */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search vaccine, disease, or code..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 text-xs"
                  />
                </div>

                {/* Program Category Filter */}
                <Select value={programFilter} onValueChange={setProgramFilter}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="All Programs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Programs (Universal + Private)</SelectItem>
                    <SelectItem value="UNIVERSAL_NIS">Universal Immunization (UIP / NIS)</SelectItem>
                    <SelectItem value="CONDITIONAL_NIS">Conditional NIS (JE Endemic)</SelectItem>
                    <SelectItem value="PRIVATE_OPTIONAL">Private / IAP Regimens</SelectItem>
                  </SelectContent>
                </Select>

                {/* Age Stage Filter */}
                <Select value={ageFilter} onValueChange={setAgeFilter}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Filter by Age Group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Age Brackets</SelectItem>
                    <SelectItem value="BIRTH">At Birth (0 - 15 Days)</SelectItem>
                    <SelectItem value="INFANCY">Infancy (6 Weeks - 1 Year)</SelectItem>
                    <SelectItem value="TODDLER">Toddler (16 - 24 Months)</SelectItem>
                    <SelectItem value="CHILDHOOD">Childhood (5 - 10 Years)</SelectItem>
                    <SelectItem value="ADOLESCENT">Adolescent (10 - 16 Years)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {loading ? (
                <div className="p-12">
                  <LoadingState message="Loading official vaccination schedule catalog..." />
                </div>
              ) : filteredCatalog.length === 0 ? (
                <div className="p-12">
                  <EmptyState
                    icon={Syringe}
                    title="No vaccine regimens match filters"
                    description="Try clearing search query or adjusting category filters."
                    actionLabel="Reset Filters"
                    onAction={() => {
                      setSearchQuery('');
                      setProgramFilter('ALL');
                      setAgeFilter('ALL');
                    }}
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead className="font-semibold text-xs text-foreground">Vaccine & Dose</TableHead>
                        <TableHead className="font-semibold text-xs text-foreground">Program</TableHead>
                        <TableHead className="font-semibold text-xs text-foreground">Target Disease</TableHead>
                        <TableHead className="font-semibold text-xs text-foreground">Due Age</TableHead>
                        <TableHead className="font-semibold text-xs text-foreground">Interval / Dependency</TableHead>
                        <TableHead className="font-semibold text-xs text-foreground">Route & Dose</TableHead>
                        <TableHead className="text-right font-semibold text-xs text-foreground pr-6">Rules</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCatalog.map((v) => {
                        const isUniversal = v.category === 'UNIVERSAL_NIS';
                        const isConditional = v.category === 'CONDITIONAL_NIS';

                        return (
                          <TableRow key={v.code} className="hover:bg-muted/30 transition-colors">
                            <TableCell className="py-3">
                              <div className="space-y-0.5">
                                <div className="font-semibold text-xs sm:text-sm text-foreground flex items-center gap-1.5">
                                  <span>{v.name}</span>
                                  {v.is_strictly_missed_past_window && (
                                    <Badge variant="destructive" className="text-[9px] px-1 py-0 h-4">
                                      Strict Window
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                                  <span className="bg-muted px-1.5 py-0.2 rounded border border-border/50 text-[10px]">
                                    {v.code}
                                  </span>
                                  <span className="text-[11px]">&bull; {v.dose_name}</span>
                                </div>
                              </div>
                            </TableCell>

                            <TableCell className="py-3">
                              {isUniversal ? (
                                <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 text-[10px]">
                                  Universal UIP
                                </Badge>
                              ) : isConditional ? (
                                <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 text-[10px]">
                                  JE Endemic
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px] text-muted-foreground">
                                  Private / IAP
                                </Badge>
                              )}
                            </TableCell>

                            <TableCell className="py-3">
                              <span className="text-xs text-foreground max-w-[180px] line-clamp-1">
                                {v.target_disease}
                              </span>
                            </TableCell>

                            <TableCell className="py-3">
                              <div className="text-xs">
                                <span className="font-medium text-foreground">{v.recommended_age_display}</span>
                                {v.grace_period_days && (
                                  <div className="text-[10px] text-muted-foreground">
                                    Grace: {v.grace_period_days}d
                                  </div>
                                )}
                              </div>
                            </TableCell>

                            <TableCell className="py-3">
                              <div className="text-xs space-y-0.5 font-mono">
                                {v.minimum_interval_days ? (
                                  <div className="text-foreground">Min {v.minimum_interval_days} days</div>
                                ) : (
                                  <span className="text-muted-foreground">None</span>
                                )}
                                {v.previous_dose_required && (
                                  <div className="text-[10px] text-muted-foreground">
                                    Req: {v.previous_dose_required}
                                  </div>
                                )}
                              </div>
                            </TableCell>

                            <TableCell className="py-3">
                              <div className="text-xs">
                                <span className="font-medium text-foreground">{v.route}</span>
                                <div className="text-[10px] text-muted-foreground">{v.dose_amount}</div>
                              </div>
                            </TableCell>

                            <TableCell className="py-3 text-right pr-6">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenDetail(v)}
                                className="h-8 text-xs gap-1"
                              >
                                <Info className="h-3 w-3" />
                                <span>Inspect</span>
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 2: RULES, PREREQUISITES & CASCADE MATRIX */}
        {/* ========================================================================= */}
        <TabsContent value="engine" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Rule 1: Strict Window Neonatal Rules */}
            <Card className="border border-border">
              <CardHeader className="p-4 sm:p-5 border-b border-border bg-muted/20">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold">Neonatal Time-Bound Critical Windows</CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                      Doses that become non-administrable once their biological cutoff elapses.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 space-y-3.5 text-xs">
                <div className="p-3 rounded-lg bg-card border border-border space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground">Hepatitis B Birth Dose</span>
                    <Badge variant="destructive" className="text-[10px]">Strict ≤ 24 Hours</Badge>
                  </div>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    Must be given strictly within 24 hours of delivery to prevent mother-to-child transmission. 
                    If missed beyond 24 hours, the birth dose is marked <strong>MISSED</strong> and cannot be caught up. 
                    Subsequent protection is provided via Pentavalent doses at 6, 10, and 14 weeks.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-card border border-border space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground">Oral Polio Vaccine Zero Dose (OPV-0)</span>
                    <Badge variant="destructive" className="text-[10px]">Strict ≤ 15 Days</Badge>
                  </div>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    Must be administered within the first 15 days of life. Beyond 15 days, OPV-0 cannot be caught up; 
                    the infant skips zero dose and initiates routine mucosal polio immunization at 6 weeks with OPV-1.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-card border border-border space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground">BCG Neonatal vs Late Catch-Up</span>
                    <Badge variant="outline" className="border-amber-500/40 text-amber-600 text-[10px]">Max 1 Year</Badge>
                  </div>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    Permissible up to 1 year of age if missed at birth. If presented beyond 1 year, NTEP/MoHFW 
                    mandates clinical evaluation and Mantoux tuberculin test prior to considering administration.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Rule 2: Minimum Interval & Prerequisite Cascades */}
            <Card className="border border-border">
              <CardHeader className="p-4 sm:p-5 border-b border-border bg-muted/20">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                    <GitBranch className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold">Minimum Interval & Prerequisite Cascades</CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                      Dynamic interval dilation when previous doses are delayed.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 space-y-3.5 text-xs">
                <div className="p-3 rounded-lg bg-card border border-border space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground">Pentavalent Series (1 &rarr; 2 &rarr; 3)</span>
                    <span className="font-mono text-primary text-[11px] font-semibold">Min 28 Days Interval</span>
                  </div>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    Pentavalent-2 requires Pentavalent-1 with at least 28 days spacing. 
                    If Pentavalent-1 is delayed (e.g. given at 12 weeks instead of 6), the engine automatically calculates 
                    Pentavalent-2 due date as <code>Date(Dose 1) + 28 days</code>, strictly preventing premature administration.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-card border border-border space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground">Pentavalent-3 &rarr; DPT Booster 1</span>
                    <span className="font-mono text-primary text-[11px] font-semibold">Min 180 Days (6 Mos)</span>
                  </div>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    DPT Booster 1 cannot be administered until at least 6 months (180 days) after Pentavalent-3 completion. 
                    Even if the child reaches the nominal age of 16 months, the booster is locked until the interval satisfies clinical thresholds.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-card border border-border space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground">DPT-B1 &rarr; DPT Booster 2 Transition</span>
                    <span className="font-mono text-primary text-[11px] font-semibold">Max 7 Years of Age</span>
                  </div>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    DPT Booster 2 is scheduled at 5-6 years. Whole-cell pertussis (wP) is contraindicated past 7 years due to neurological 
                    reactogenicity. Children presenting &ge;7 years automatically transition to adult Td vaccine under NIS protocol.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Validation Constraints Engine Specification */}
          <Card className="border border-border">
            <CardHeader className="p-4 sm:p-5 border-b border-border bg-card">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-primary" />
                <span>Deterministic Validation Constraints Enforced by Backend</span>
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                All records submitted by patients, clinic staff, or mobile sync undergo rigorous server-side validation.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-1">
                  <div className="font-bold text-foreground flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-primary" />
                    <span>Future Date Guard</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Rejects any record where <code>administered_date &gt; today</code> with HTTP 400.
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-1">
                  <div className="font-bold text-foreground flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-primary" />
                    <span>Pre-Natal Guard</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Rejects any dose logged with <code>administered_date &lt; date_of_birth</code>.
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-1">
                  <div className="font-bold text-foreground flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-primary" />
                    <span>Duplicate Dose Guard</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Database compound unique index on <code>(member_id, vaccine_code, dose_number)</code> blocks double recording.
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-1">
                  <div className="font-bold text-foreground flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-primary" />
                    <span>Strict Window Exclusion</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    HepB Birth &gt;24h and OPV-0 &gt;15d are automatically evaluated as <code>MISSED</code> by arithmetic engine.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 3: OPERATIONAL CONTROLS & REGIONAL POLICIES */}
        {/* ========================================================================= */}
        <TabsContent value="settings" className="space-y-6">
          <form onSubmit={handleSaveOperationalSettings}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Program Activation Policies */}
              <Card className="border border-border">
                <CardHeader className="p-4 sm:p-5 border-b border-border bg-card">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span>National & Regional Program Activation</span>
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Control how clinical schedules apply across public and private healthcare facilities.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-5 space-y-4 text-xs">
                  {/* Universal NIS */}
                  <div className="flex items-start justify-between gap-4 p-3 rounded-lg bg-muted/30 border border-border">
                    <div className="space-y-1 min-w-0">
                      <div className="font-semibold text-foreground flex items-center gap-2">
                        <span>Universal Immunization Programme (UIP / NIS)</span>
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[9px]">
                          Mandatory Base
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-[11px]">
                        The routine Government of India UIP schedule. All free primary and booster immunizations are enabled globally.
                      </p>
                    </div>
                    <div className="flex items-center h-5">
                      <input
                        type="checkbox"
                        checked={operationalSettings.universalUIPEnabled}
                        disabled
                        className="rounded border-border text-primary cursor-not-allowed opacity-80"
                      />
                    </div>
                  </div>

                  {/* Japanese Encephalitis Auto-Detection */}
                  <div className="flex items-start justify-between gap-4 p-3 rounded-lg bg-muted/30 border border-border">
                    <div className="space-y-1 min-w-0">
                      <div className="font-semibold text-foreground">
                        Japanese Encephalitis (JE) Endemic Zone Detection
                      </div>
                      <p className="text-muted-foreground text-[11px]">
                        Automatically activate JE-1 (9m) and JE-2 (16-24m) when family residence pincode matches one of the 231 MoHFW endemic districts.
                      </p>
                    </div>
                    <div className="flex items-center h-5">
                      <input
                        type="checkbox"
                        checked={operationalSettings.jeEndemicAutoDetection}
                        onChange={(e) => setOperationalSettings(prev => ({ ...prev, jeEndemicAutoDetection: e.target.checked }))}
                        className="rounded border-border text-primary h-4 w-4 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Private / IAP Dual Schedule Integration */}
                  <div className="flex items-start justify-between gap-4 p-3 rounded-lg bg-muted/30 border border-border">
                    <div className="space-y-1 min-w-0">
                      <div className="font-semibold text-foreground">
                        Private / IAP ACVIP Dual Schedule Option
                      </div>
                      <p className="text-muted-foreground text-[11px]">
                        Allow families and private practitioners to toggle optional vaccines (MMR, Varicella, HepA, Typhoid Conjugate, HPV).
                      </p>
                    </div>
                    <div className="flex items-center h-5">
                      <input
                        type="checkbox"
                        checked={operationalSettings.privateIAPDualSchedule}
                        onChange={(e) => setOperationalSettings(prev => ({ ...prev, privateIAPDualSchedule: e.target.checked }))}
                        className="rounded border-border text-primary h-4 w-4 cursor-pointer"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notification & Overdue Cadence Parameters */}
              <Card className="border border-border">
                <CardHeader className="p-4 sm:p-5 border-b border-border bg-card">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span>Reminder Cadence & Overdue Thresholds</span>
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Configure operational notice intervals and cold-chain alert thresholds.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-5 space-y-4 text-xs">
                  {/* Default Grace Period */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Standard Due Grace Period</Label>
                    <Select
                      value={operationalSettings.defaultGracePeriodDays.toString()}
                      onValueChange={(val) => setOperationalSettings(prev => ({ ...prev, defaultGracePeriodDays: parseInt(val, 10) }))}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="14">14 Days (Aggressive Defaulter Prevention)</SelectItem>
                        <SelectItem value="28">28 Days (MoHFW Standard 4-Week Grace)</SelectItem>
                        <SelectItem value="60">60 Days (Relaxed Rural Interval)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-[10px] text-muted-foreground">
                      Time elapsed post-due-date before status transitions to <code>OVERDUE</code> and alerts community health workers.
                    </p>
                  </div>

                  {/* Defaulter Escalation Threshold */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Defaulter Escalation Threshold (Days)</Label>
                    <Input
                      type="number"
                      min={7}
                      max={90}
                      value={operationalSettings.defaulterEscalationThresholdDays}
                      onChange={(e) => setOperationalSettings(prev => ({ ...prev, defaulterEscalationThresholdDays: parseInt(e.target.value, 10) || 30 }))}
                      className="h-9 text-xs"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Days of continuous overdue status before escalating case to Sub-Centre ANM dashboard.
                    </p>
                  </div>

                  {/* Cold-Chain Temp Limit */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Cold-Chain Temperature Deviation Threshold (°C)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={operationalSettings.coldChainDeviationAlertTempC}
                      onChange={(e) => setOperationalSettings(prev => ({ ...prev, coldChainDeviationAlertTempC: parseFloat(e.target.value) || 8.0 }))}
                      className="h-9 text-xs font-mono"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Upper temperature boundary for cold-chain ILR (Ice-Lined Refrigerator) monitoring compliance.
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="p-4 sm:p-5 border-t border-border flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground font-mono">
                    Last modified: {new Date(operationalSettings.lastUpdated).toLocaleDateString()}
                  </span>
                  <Button type="submit" size="sm" disabled={savingSettings} className="gap-1.5 h-8">
                    <Save className="h-3.5 w-3.5" />
                    <span>{savingSettings ? 'Saving...' : 'Save Configuration'}</span>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </form>
        </TabsContent>
      </Tabs>

      {/* ========================================================================= */}
      {/* VACCINE DETAIL MODAL / CLINICAL SPECIFICATION DRAWER */}
      {/* ========================================================================= */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedVaccine && (
            <div className="space-y-5">
              <DialogHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <DialogTitle className="text-lg font-bold flex items-center gap-2">
                      <span>{selectedVaccine.name}</span>
                      <Badge variant="outline" className="font-mono text-xs">
                        {selectedVaccine.code}
                      </Badge>
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                      {selectedVaccine.full_name || selectedVaccine.name} &bull; {selectedVaccine.dose_name}
                    </DialogDescription>
                  </div>
                  <Badge
                    className={
                      selectedVaccine.category === 'UNIVERSAL_NIS'
                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                        : selectedVaccine.category === 'CONDITIONAL_NIS'
                        ? 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                        : 'bg-muted text-muted-foreground'
                    }
                  >
                    {selectedVaccine.category}
                  </Badge>
                </div>
              </DialogHeader>

              {/* Core Specification Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-xl border border-border bg-muted/20 text-xs">
                <div>
                  <span className="text-muted-foreground text-[11px] block">Target Disease</span>
                  <span className="font-semibold text-foreground mt-0.5 block">{selectedVaccine.target_disease}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-[11px] block">Recommended Due Age</span>
                  <span className="font-semibold text-foreground mt-0.5 block">{selectedVaccine.recommended_age_display}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-[11px] block">Administration Route</span>
                  <span className="font-semibold text-foreground mt-0.5 block">{selectedVaccine.route}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-[11px] block">Dose Amount</span>
                  <span className="font-semibold text-foreground mt-0.5 block font-mono">{selectedVaccine.dose_amount}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-[11px] block">Anatomical Site</span>
                  <span className="font-semibold text-foreground mt-0.5 block">{selectedVaccine.site}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-[11px] block">Minimum Interval</span>
                  <span className="font-semibold text-foreground mt-0.5 block font-mono">
                    {selectedVaccine.minimum_interval_days ? `${selectedVaccine.minimum_interval_days} Days` : 'N/A (First/Single)'}
                  </span>
                </div>
              </div>

              {/* Strict Window / Catch Up Details */}
              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-lg border border-border bg-card space-y-2">
                  <h4 className="font-bold text-foreground flex items-center gap-1.5 text-xs">
                    <ShieldAlert className="h-4 w-4 text-primary" />
                    <span>Clinical Catch-Up & Boundary Constraints</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-muted-foreground">Catch-Up Permissible:</span>{' '}
                      <span className="font-semibold text-foreground">{selectedVaccine.can_catch_up ? 'Yes' : 'No'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Strict Window:</span>{' '}
                      <span className="font-semibold text-foreground">{selectedVaccine.is_strictly_missed_past_window ? 'Yes' : 'No'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Max Age Limit:</span>{' '}
                      <span className="font-semibold text-foreground font-mono">
                        {selectedVaccine.max_age_days ? `${selectedVaccine.max_age_days} Days` : 'No hard cutoff'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Grace Period:</span>{' '}
                      <span className="font-semibold text-foreground font-mono">
                        {selectedVaccine.grace_period_days ? `${selectedVaccine.grace_period_days} Days` : 'None'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Clinical Notes & Contraindications */}
                {selectedVaccine.clinical_review_notes && (
                  <div className="p-3.5 rounded-lg border border-amber-500/30 bg-amber-500/5 space-y-1">
                    <h5 className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5 text-xs">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                      <span>Clinical Review Directive</span>
                    </h5>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {selectedVaccine.clinical_review_notes}
                    </p>
                  </div>
                )}

                {/* Statutory Reference Citation */}
                <div className="p-3 rounded-lg border border-border bg-muted/30 text-[11px] flex items-center justify-between">
                  <span className="text-muted-foreground">Official Source Guideline:</span>
                  <span className="font-medium text-foreground">{selectedVaccine.source_guideline}</span>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => setDetailModalOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
