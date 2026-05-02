export type ModoData = "TOTAL" | "DIA" | "INTERVALO" | "MES_ANO";

export interface FiltroData {
  modo: ModoData;
  diaEspecifico: string;
  intervaloInicio: string;
  intervaloFim: string;
  mesAno: string;
}

function toLocalDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function hoje(): string { return toLocalDateString(new Date()); }

function primeiroDiaMesAtual(): string {
  const d = new Date(); d.setDate(1); return toLocalDateString(d);
}

export function filtroDataInicial(): FiltroData {
  return {
    modo: "TOTAL",
    diaEspecifico: hoje(),
    intervaloInicio: primeiroDiaMesAtual(),
    intervaloFim: hoje(),
    mesAno: hoje().slice(0, 7),
  };
}

export function labelFiltroData(f: FiltroData): string {
  if (f.modo === "TOTAL")     return "Desde o início";
  if (f.modo === "DIA")       return `Dia ${f.diaEspecifico.split("-").reverse().join("/")}`;
  if (f.modo === "MES_ANO") {
    const [ano, mes] = f.mesAno.split("-");
    const nomes = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
    return `${nomes[parseInt(mes) - 1]}/${ano}`;
  }
  if (f.modo === "INTERVALO") {
    const fmt = (s: string) => s.split("-").reverse().join("/");
    return `${fmt(f.intervaloInicio)} → ${fmt(f.intervaloFim)}`;
  }
  return "";
}