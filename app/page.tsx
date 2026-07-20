"use client";

import { ChangeEvent, useMemo, useState } from "react";
import * as XLSX from "xlsx";

type Status = "same" | "changed" | "onlyA" | "onlyB" | "moved";
type Row = { item: number; category: string; key: string; field: string; status: Status; valueA: string; valueB: string; description: string };
type Parsed = { file: File; xml: XMLDocument; hostname: string; version: string; scopes: Scope[] };
type Scope = { id: string; label: string; node: Element };

const ITEMS = [
  [1,"設備&HA資訊","scalar","deviceconfig/system"],[2,"MGT存取設定","scalar","mgt-config"],[3,"系統設定","scalar","deviceconfig/system"],
  [4,"Network Profiles","entries","network/profiles"],[5,"Interface對應表","entries","network/interface"],[6,"Routing Table","entries","network/virtual-router/entry/routing-table/ip/static-route"],
  [7,"IKE Crypto Profiles","entries","network/ike/crypto-profiles/ike-crypto-profiles"],[8,"IPSec Crypto Profiles","entries","network/ike/crypto-profiles/ipsec-crypto-profiles"],
  [9,"IKE Gateway","entries","network/ike/gateway"],[10,"IPSec Tunnel","entries","network/tunnel/ipsec"],[11,"Object 差異總表","summary","object"],
  [12,"Address","entries","address"],[13,"Address-Group","entries","address-group"],[14,"Service","entries","service"],[15,"Service-Group","entries","service-group"],[16,"Schedule","entries","schedule"],[17,"Tag","entries","tag"],[18,"Application","entries","application"],[19,"Application-Group","entries","application-group"],[20,"Custom-URL","entries","profiles/custom-url-category"],[21,"External-List","entries","external-list"],[22,"Policy差異總表","summary","policy"],
  [23,"Security Rules","entries","rulebase/security/rules"],[24,"Security順序","sequence","rulebase/security/rules"],[25,"NAT Rules","entries","rulebase/nat/rules"],[26,"NAT順序","sequence","rulebase/nat/rules"],[27,"QoS Rules","entries","rulebase/qos/rules"],[28,"QoS順序","sequence","rulebase/qos/rules"],[29,"App-Override Rules","entries","rulebase/application-override/rules"],[30,"App-Override順序","sequence","rulebase/application-override/rules"],[31,"PBF Rules","entries","rulebase/pbf/rules"],[32,"PBF順序","sequence","rulebase/pbf/rules"],[33,"Decryption Rules","entries","rulebase/decryption/rules"],[34,"Decryption順序","sequence","rulebase/decryption/rules"],[35,"DoS Rules","entries","rulebase/dos/rules"],[36,"DoS順序","sequence","rulebase/dos/rules"],
] as const;

const OBJECT_ITEMS = new Set([12,13,14,15,16,17,18,19,20,21]);
const POLICY_ITEMS = new Set([23,24,25,26,27,28,29,30,31,32,33,34,35,36]);
const statusText: Record<Status,string> = { same:"一致", changed:"變更", onlyA:"僅存在 A", onlyB:"僅存在 B", moved:"順序提示" };
const direct = (node: Element, tag: string) => Array.from(node.children).filter(x => x.tagName === tag) as Element[];
const findPath = (root: Element, path: string) => path.split("/").reduce<Element[]>((nodes, tag) => nodes.flatMap(n => direct(n, tag)), [root]);
const clean = (v: string) => v.replace(/\s+/g," ").trim();
const masked = (field: string, v: string) => /phash|key|community|password/i.test(field) && v ? "••••••（已遮罩）" : v;

function flatten(node: Element, prefix = "", out: Record<string,string> = {}) {
  const children = Array.from(node.children) as Element[];
  if (!children.length) { if (prefix) out[prefix] = masked(prefix, clean(node.textContent || "")); return out; }
  const groups = new Map<string, Element[]>(); children.forEach(c => groups.set(c.tagName, [...(groups.get(c.tagName) || []), c]));
  groups.forEach((nodes, tag) => {
    const key = prefix ? `${prefix}.${tag}` : tag;
    if (tag === "member") out[key] = nodes.map(n => clean(n.textContent || "")).sort().join("、");
    else nodes.forEach((n, i) => flatten(n, nodes.length > 1 ? `${key}[${i + 1}]` : key, out));
  });
  return out;
}
function xmlEntries(root: Element, path: string) {
  const containers = findPath(root, path);
  // PA 的設定常是「分類節點 → entry」，例如 network/profiles 與 network/interface。
  const entries = containers.flatMap(c => [...direct(c,"entry"), ...(Array.from(c.children) as Element[]).flatMap(group => direct(group,"entry"))]);
  return new Map(entries.map(e => [e.getAttribute("name") || "(未命名)", flatten(e)]));
}
function mergedEntries(p: Parsed, scopeId: string, path: string) {
  const scope = p.scopes.find(s => s.id === scopeId)?.node;
  const root = p.xml.documentElement;
  // 網路與設備設定位於 device entry；物件需先納入 shared，再由 vsys/DG 覆寫。
  if (path.startsWith("network/")) return xmlEntries(root, `devices/entry/${path}`);
  if (path.startsWith("rulebase/")) return scope ? xmlEntries(scope, path) : new Map<string,Record<string,string>>();
  const shared = xmlEntries(root, `shared/${path}`);
  const local = scope ? xmlEntries(scope, path) : new Map<string,Record<string,string>>();
  return new Map([...shared, ...local]);
}
function scalar(root: Element, path: string) { const n = findPath(root,path)[0]; return n ? flatten(n) : {}; }
function focusedSettings(p: Parsed, item: number) {
  const root = p.xml.documentElement;
  const values: Record<string,string> = {};
  const add = (label: string, path: string) => {
    const node = findPath(root,path)[0];
    if (node) Object.assign(values, flatten(node,label));
  };
  if (item === 1) {
    add("Device", "devices/entry/deviceconfig/system");
    add("HA", "devices/entry/deviceconfig/high-availability");
  } else if (item === 2) {
    add("MGT", "mgt-config");
    add("MGT Permitted IP", "devices/entry/deviceconfig/system/permitted-ip");
  } else {
    add("System", "devices/entry/deviceconfig/system");
    add("Shared Logging", "shared/log-settings");
    values["vSys.vSys Count"] = String(p.scopes.filter(s => s.id.startsWith("vsys:")).length);
  }
  return new Map([["系統設定", values]]);
}
function describe(status: Status, category: string, key: string, field: string, a: string, b: string) {
  if (status === "same") return "一致";
  if (status === "onlyA") return `僅存在於 A：${category}「${key}」`;
  if (status === "onlyB") return `僅存在於 B：${category}「${key}」`;
  if (status === "moved") return `規則「${key}」順序：A 第 ${a} 條／B 第 ${b} 條（雙機核對提示）`;
  return `${key} 的 ${field}：${a || "（未設定）"} → ${b || "（未設定）"}`;
}
function compareMaps(item: number, category: string, a: Map<string,Record<string,string>>, b: Map<string,Record<string,string>>) {
  const rows: Row[] = [];
  new Set([...a.keys(),...b.keys()]).forEach(key => {
    const av = a.get(key), bv = b.get(key);
    if (!av || !bv) { const status: Status = av ? "onlyA" : "onlyB"; rows.push({item,category,key,field:"—",status,valueA:av ? "存在" : "—",valueB:bv ? "存在" : "—",description:describe(status,category,key,"","","")}); return; }
    new Set([...Object.keys(av),...Object.keys(bv)]).forEach(field => { const va=av[field]||"", vb=bv[field]||""; const status: Status = va===vb ? "same" : "changed"; rows.push({item,category,key,field,status,valueA:va,valueB:vb,description:describe(status,category,key,field,va,vb)}); });
  }); return rows;
}
function compareSequence(item: number, category: string, a: Map<string,Record<string,string>>, b: Map<string,Record<string,string>>) {
  const ak=[...a.keys()], bk=[...b.keys()]; return [...new Set([...ak,...bk])].map(key => { const ai=ak.indexOf(key), bi=bk.indexOf(key); const status: Status=ai<0?"onlyB":bi<0?"onlyA":ai===bi?"same":"moved"; return {item,category,key,field:"順序",status,valueA:ai<0?"—":String(ai+1),valueB:bi<0?"—":String(bi+1),description:describe(status,category,key,"順序",String(ai+1),String(bi+1))}; });
}
function scopes(xml: XMLDocument): Scope[] { const r=xml.documentElement; const v=[...r.querySelectorAll("devices > entry > vsys > entry")].map((n,i)=>({id:`vsys:${n.getAttribute("name")||i}`,label:`vsys：${n.getAttribute("name")||`vsys${i+1}`}`,node:n})); const d=[...r.querySelectorAll("devices > entry > device-group > entry")].map((n,i)=>({id:`dg:${n.getAttribute("name")||i}`,label:`Device Group：${n.getAttribute("name")||`DG${i+1}`}`,node:n})); return [...v,...d]; }
function parse(file: File): Promise<Parsed> { return file.text().then(t=>{ const xml=new DOMParser().parseFromString(t,"application/xml"); if(xml.querySelector("parsererror") || xml.documentElement.tagName !== "config") throw new Error("不是有效的 PA XML 設定檔"); const sys=xml.querySelector("devices > entry > deviceconfig > system"); return {file,xml,hostname:sys?.querySelector(":scope > hostname")?.textContent?.trim()||file.name,version:xml.documentElement.getAttribute("version")||"未標示",scopes:scopes(xml)}; }); }

export default function Home() {
  const [a,setA]=useState<Parsed>(); const [b,setB]=useState<Parsed>(); const [scopeA,setScopeA]=useState(""); const [scopeB,setScopeB]=useState(""); const [rows,setRows]=useState<Row[]>([]); const [active,setActive]=useState(1); const [onlyDiff,setOnlyDiff]=useState(false); const [query,setQuery]=useState(""); const [filter,setFilter]=useState("all"); const [error,setError]=useState(""); const [busy,setBusy]=useState(false);
  const upload = async (e: ChangeEvent<HTMLInputElement>, side:"a"|"b") => { const f=e.target.files?.[0]; if(!f) return; try { const parsed=await parse(f); side==="a" ? (setA(parsed),setScopeA(parsed.scopes[0]?.id||"")) : (setB(parsed),setScopeB(parsed.scopes[0]?.id||"")); setRows([]); setError(""); } catch(err) { setError(err instanceof Error ? err.message : "讀取失敗"); } };
  const run=()=>{ if(!a||!b) return setError("請先選擇兩份 PA XML 設定檔。"); setBusy(true); setTimeout(()=>{ const data:Row[]=[]; ITEMS.forEach(([id,name,kind,path])=>{ if(kind==="summary") return; const am=kind==="scalar" ? focusedSettings(a,id) : mergedEntries(a,scopeA,path); const bm=kind==="scalar" ? focusedSettings(b,id) : mergedEntries(b,scopeB,path); data.push(...(kind==="sequence" ? compareSequence(id,name,am,bm) : compareMaps(id,name,am,bm))); }); [11,22].forEach(id=>{ const name=ITEMS.find(x=>x[0]===id)![1]; const ids=id===11?OBJECT_ITEMS:POLICY_ITEMS; const source=data.filter(r=>ids.has(r.item)); const by=new Map<string,Row[]>(); source.forEach(r=>by.set(r.category,[...(by.get(r.category)||[]),r])); by.forEach((rs,key)=>{ const diff=rs.filter(r=>r.status!=="same").length; data.push({item:id,category:name,key,field:"差異統計",status:diff?"changed":"same",valueA:String(rs.length),valueB:String(diff),description:`${key}：共 ${rs.length} 筆參數，${diff} 筆差異`}); }); }); setRows(data); setActive(1); setBusy(false); },20); };
  const activeRows=useMemo(()=>rows.filter(r=>r.item===active).filter(r=>!onlyDiff||r.status!=="same").filter(r=>filter==="all"||r.status===filter).filter(r=>`${r.key} ${r.field} ${r.description}`.toLowerCase().includes(query.toLowerCase())),[rows,active,onlyDiff,filter,query]);
  const counts=(id:number)=>rows.filter(r=>r.item===id && r.status!=="same").length;
  const exportXlsx=()=>{ if(!rows.length||!a||!b) return; const wb=XLSX.utils.book_new(); const summary=XLSX.utils.aoa_to_sheet([["比較項目","參數總數","差異數"],["來源 A",a.hostname,`版本 ${a.version}`],["來源 B",b.hostname,`版本 ${b.version}`],...ITEMS.map(([id,name])=>[`${id}. ${name}`,rows.filter(r=>r.item===id).length,counts(id)])]); summary["!cols"]=[{wch:28},{wch:16},{wch:16}]; XLSX.utils.book_append_sheet(wb,summary,"封面摘要"); ITEMS.forEach(([id,name])=>{ const data=[["類別","名稱/物件","參數","狀態",`${a.hostname} 值`,`${b.hostname} 值`,"差異說明"],...rows.filter(r=>r.item===id).map(r=>[r.category,r.key,r.field,statusText[r.status],r.valueA,r.valueB,r.description])]; const ws=XLSX.utils.aoa_to_sheet(data); ws["!cols"]=[{wch:22},{wch:28},{wch:28},{wch:14},{wch:34},{wch:34},{wch:52}]; ws["!autofilter"]={ref:`A1:G${data.length}`}; XLSX.utils.book_append_sheet(wb,ws,`${id}-${name}`.slice(0,31)); }); XLSX.writeFile(wb,`PA比對_${a.hostname}_vs_${b.hostname}_${new Date().toISOString().slice(0,10)}.xlsx`); };
  const current=ITEMS.find(x=>x[0]===active)!;
  return <main><header><div><p className="eyebrow">OFFLINE · CLIENT-SIDE AUDIT</p><h1>PA 防火牆設定比較</h1><p className="sub">兩份設定檔只在此瀏覽器記憶體中解析，不會上傳或儲存。</p></div><button className="excel" onClick={exportXlsx} disabled={!rows.length}>下載 Excel 報表</button></header>
    <section className="upload-card"><div className="files"><label>來源 A<input type="file" accept=".xml,text/xml,application/xml" onChange={e=>upload(e,"a")}/><span>{a ? `${a.file.name} · ${a.hostname} · v${a.version}` : "選擇 PA XML 設定檔"}</span></label><label>來源 B<input type="file" accept=".xml,text/xml,application/xml" onChange={e=>upload(e,"b")}/><span>{b ? `${b.file.name} · ${b.hostname} · v${b.version}` : "選擇 PA XML 設定檔"}</span></label></div><div className="scope"><label>A 範圍<select value={scopeA} onChange={e=>setScopeA(e.target.value)} disabled={!a}><option value="">根設定 / 自動</option>{a?.scopes.map(s=><option value={s.id} key={s.id}>{s.label}</option>)}</select></label><label>B 範圍<select value={scopeB} onChange={e=>setScopeB(e.target.value)} disabled={!b}><option value="">根設定 / 自動</option>{b?.scopes.map(s=><option value={s.id} key={s.id}>{s.label}</option>)}</select></label><button className="compare" onClick={run} disabled={busy}>{busy?"比對中…":"開始比對"}</button></div>{error&&<p className="error">{error}</p>}</section>
    {rows.length>0 && <><section className="stats"><div><b>{rows.filter(r=>r.status!=="same").length}</b><span>總差異</span></div><div><b>{rows.filter(r=>r.status==="onlyB").length}</b><span>僅存在 B</span></div><div><b>{rows.filter(r=>r.status==="onlyA").length}</b><span>僅存在 A</span></div><div><b>{rows.filter(r=>r.status==="changed").length}</b><span>內容變更</span></div><div><b>{rows.filter(r=>r.status==="same").length}</b><span>一致參數</span></div></section><section className="workspace"><aside><div className="nav-title">比對項目 <span>36</span></div>{ITEMS.map(([id,name])=><button key={id} className={active===id?"active":""} onClick={()=>setActive(id)}><span>{id}. {name}</span><em>{counts(id)}</em></button>)}</aside><article><div className="table-head"><div><p className="eyebrow">項目 {current[0]}</p><h2>{current[1]}</h2></div><div className="tools"><label><input type="checkbox" checked={onlyDiff} onChange={e=>setOnlyDiff(e.target.checked)}/> 僅看差異</label><select value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">全部狀態</option><option value="onlyA">僅存在 A</option><option value="onlyB">僅存在 B</option><option value="changed">變更</option><option value="moved">順序提示</option><option value="same">一致</option></select><input placeholder="搜尋名稱、欄位或說明" value={query} onChange={e=>setQuery(e.target.value)}/></div></div><p className="result-note">顯示 {activeRows.length} 筆；{a?.hostname||"A"} 與 {b?.hostname||"B"} 為對等比較，方向不代表新舊。</p><div className="table-wrap"><table><thead><tr><th>名稱 / 物件</th><th>參數</th><th>狀態</th><th>{a?.hostname||"A"} 值</th><th>{b?.hostname||"B"} 值</th><th>差異說明</th></tr></thead><tbody>{activeRows.map((r,i)=><tr key={`${r.key}-${r.field}-${i}`} className={r.status}><td>{r.key}</td><td>{r.field}</td><td><span className="badge">{statusText[r.status]}</span></td><td>{r.valueA||"—"}</td><td>{r.valueB||"—"}</td><td>{r.description}</td></tr>)}</tbody></table></div></article></section></>}</main>;
}
