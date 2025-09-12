import { useEffect, useState } from "react";
import { useRef } from "react";

export type RepositorioItem = {
  _id: string;
  iniciativa: string;
  descricao: string;
  relatorio?: string;
  ficha?: string;
};

export default function Repositorio() {
  const [editingRelatorioId, setEditingRelatorioId] = useState<string | null>(
    null
  );
  const [editingFichaId, setEditingFichaId] = useState<string | null>(null);
  const [urlRelatorioInput, setUrlRelatorioInput] = useState("");
  const [urlFichaInput, setUrlFichaInput] = useState("");
  const [data, setData] = useState<RepositorioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("http://localhost:3002/api/experimentos")
      .then((res) => res.json())
      .then((json) => {
        // Busca os campos ignorando maiúsculas/minúsculas
        const mapped = (json as RepositorioItem[]).map((item) => {
          const keys = Object.keys(item);
          const iniciativaKey = keys.find(
            (k) => k.toLowerCase() === "iniciativa"
          );
          // Aceita descricao, descrição, Descrição
          const descricaoKey = keys.find(
            (k) =>
              [
                "descricao",
                "descrição",
                "descriçao",
                "descrição",
                "descrição",
              ].includes(k.toLowerCase()) || k === "Descrição"
          );
          const relatorioKey = keys.find(
            (k) => k.toLowerCase() === "relatorio"
          );
          const fichaKey = keys.find((k) => k.toLowerCase() === "ficha");
          return {
            _id: item._id,
            iniciativa: iniciativaKey ? item[iniciativaKey] : "",
            descricao: descricaoKey ? item[descricaoKey] : "",
            relatorio: relatorioKey ? item[relatorioKey] : "",
            ficha: fichaKey ? item[fichaKey] : "",
          };
        });
        setData(mapped);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-rose-50 p-4">
      <h1 className="text-2xl font-bold mb-4 text-[#7a0019]">
        Repositório de Relatórios e Fichas
      </h1>
      {loading ? (
        <div>Carregando...</div>
      ) : (
        <>
          <div className="mb-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome da iniciativa..."
              className="border rounded px-3 py-2 w-80 text-gray-900"
            />
          </div>
          <table className="w-full bg-white rounded shadow">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left">Iniciativa</th>
                <th className="px-4 py-2 text-left">Descrição</th>
                <th className="px-4 py-2 text-left">Relatório</th>
                <th className="px-4 py-2 text-left">Ficha</th>
                <th className="px-4 py-2 text-left">Ações</th>
              </tr>
            </thead>
            <tbody>
              {data
                .filter(
                  (item) =>
                    !search ||
                    (item.iniciativa ?? "")
                      .toLowerCase()
                      .includes(search.toLowerCase())
                )
                .map((item) => (
                  <tr key={item._id} className="border-t">
                    <td className="px-4 py-2 text-gray-900">
                      {item.iniciativa}
                    </td>
                    <td className="px-4 py-2 text-gray-900">
                      {item.descricao}
                    </td>
                    <td className="px-4 py-2">
                      {editingRelatorioId === item._id ? (
                        <form
                          onSubmit={async (e) => {
                            e.preventDefault();
                            await fetch(
                              `http://localhost:3002/api/experimentos/${item._id}`,
                              {
                                method: "PUT",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  relatorio: urlRelatorioInput,
                                }),
                              }
                            );
                            setEditingRelatorioId(null);
                            setUrlRelatorioInput("");
                            setData((prev) =>
                              prev.map((exp) =>
                                exp._id === item._id
                                  ? { ...exp, relatorio: urlRelatorioInput }
                                  : exp
                              )
                            );
                          }}
                        >
                          <input
                            type="url"
                            value={urlRelatorioInput}
                            onChange={(e) =>
                              setUrlRelatorioInput(e.target.value)
                            }
                            placeholder="Informe a URL do relatório"
                            className="border rounded px-2 py-1 w-48 text-gray-900 mr-2"
                            required
                          />
                          <button
                            type="submit"
                            className="px-2 py-1 bg-[#7a0019] text-white rounded border border-[#7a0019] hover:bg-[#5a0011] transition-colors"
                          >
                            Salvar
                          </button>
                          <button
                            type="button"
                            className="ml-2 px-2 py-1 bg-[#7a0019] text-white rounded border border-[#7a0019] hover:bg-[#5a0011] transition-colors"
                            onClick={() => {
                              setEditingRelatorioId(null);
                              setUrlRelatorioInput("");
                            }}
                          >
                            Cancelar
                          </button>
                        </form>
                      ) : item.relatorio ? (
                        <a
                          href={item.relatorio}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline"
                        >
                          Acessar Relatório
                        </a>
                      ) : (
                        <button
                          className="px-2 py-1 bg-[#7a0019] text-white rounded border border-[#7a0019] hover:bg-[#5a0011] transition-colors"
                          onClick={() => {
                            setEditingRelatorioId(item._id);
                            setUrlRelatorioInput("");
                          }}
                        >
                          Adicionar URL
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {editingFichaId === item._id ? (
                        <form
                          onSubmit={async (e) => {
                            e.preventDefault();
                            await fetch(
                              `http://localhost:3002/api/experimentos/${item._id}`,
                              {
                                method: "PUT",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ ficha: urlFichaInput }),
                              }
                            );
                            setEditingFichaId(null);
                            setUrlFichaInput("");
                            setData((prev) =>
                              prev.map((exp) =>
                                exp._id === item._id
                                  ? { ...exp, ficha: urlFichaInput }
                                  : exp
                              )
                            );
                          }}
                        >
                          <input
                            type="url"
                            value={urlFichaInput}
                            onChange={(e) => setUrlFichaInput(e.target.value)}
                            placeholder="Informe a URL da ficha"
                            className="border rounded px-2 py-1 w-48 text-gray-900 mr-2"
                            required
                          />
                          <button
                            type="submit"
                            className="px-2 py-1 bg-[#7a0019] text-white rounded border border-[#7a0019] hover:bg-[#5a0011] transition-colors"
                          >
                            Salvar
                          </button>
                          <button
                            type="button"
                            className="ml-2 px-2 py-1 bg-[#7a0019] text-white rounded border border-[#7a0019] hover:bg-[#5a0011] transition-colors"
                            onClick={() => {
                              setEditingFichaId(null);
                              setUrlFichaInput("");
                            }}
                          >
                            Cancelar
                          </button>
                        </form>
                      ) : item.ficha ? (
                        <a
                          href={item.ficha}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline"
                        >
                          Acessar Ficha
                        </a>
                      ) : (
                        <button
                          className="px-2 py-1 bg-[#7a0019] text-white rounded border border-[#7a0019] hover:bg-[#5a0011] transition-colors"
                          onClick={() => {
                            setEditingFichaId(item._id);
                            setUrlFichaInput("");
                          }}
                        >
                          Adicionar URL
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-2 flex gap-2 items-center">
                      {item.relatorio && (
                        <a
                          href={item.relatorio}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 bg-[#7a0019] text-white rounded"
                        >
                          Acessar Relatório
                        </a>
                      )}
                      {item.ficha && (
                        <a
                          href={item.ficha}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 bg-[#7a0019] text-white rounded"
                        >
                          Acessar Ficha
                        </a>
                      )}
                      <button
                        className="px-2 py-1 bg-[#7a0019] text-white rounded border border-[#7a0019] hover:bg-[#5a0011] transition-colors"
                        onClick={() => {
                          setEditingRelatorioId(item._id);
                          setUrlRelatorioInput(item.relatorio || "");
                          setEditingFichaId(item._id);
                          setUrlFichaInput(item.ficha || "");
                        }}
                      >
                        Alterar
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
