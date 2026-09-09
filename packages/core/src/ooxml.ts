// OOXML uses escape sequences in addition to XML entities. One-pass decoding preserves escaped underscores.
export const decodeXlsxText=(text:string)=>text.replace(/_x([0-9a-f]{4})_/gi,(_,hex:string)=>String.fromCharCode(parseInt(hex,16)));
export const encodeXlsxText=(text:string)=>text.replace(/_x[0-9a-f]{4}_/gi,match=>'_x005F_'+match.slice(1)).replaceAll('\r','_x000D_');

export const encodeFormula=(formula:string)=>formula.replace(/"(?:[^"]|"")*"|'(?:[^']|'')*'|(?<![A-Za-z0-9_.])(XLOOKUP|IFNA|CONCAT)\s*\(/gi,(match,name:string|undefined)=>name?'_xlfn.'+name.toUpperCase()+'(':match);
