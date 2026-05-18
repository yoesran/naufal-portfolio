import { Suspense, lazy, useState } from "react";

const LabRemote = lazy(() =>
  import("./components/LabRemote").then((m) => ({ default: m.LabRemote })),
);

export default function App() {
  const [show, setShow] = useState(false);

  return (
    <div style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>Naufal portfolio — v0.1</h1>
      <button onClick={() => setShow((s) => !s)}>
        {show ? "Hide" : "Load"} lab remote
      </button>
      {show && (
        <Suspense fallback={<p>Loading remote…</p>}>
          <LabRemote />
        </Suspense>
      )}
    </div>
  );
}
