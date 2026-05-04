import { Route } from "@solidjs/router";
import { SpellDetailPage } from "./pages/SpellDetailPage";
import { SpellEditorPage } from "./pages/SpellEditorPage";
import { SpellListPage } from "./pages/SpellListPage";
import { RootRedirect } from "./pages/RootRedirect";

export default function App() {
  return (
    <>
      <Route path="/" component={RootRedirect} />
      <Route path="/spells" component={SpellListPage} />
      <Route path="/spells/new" component={SpellEditorPage} />
      <Route path="/spells/:id" component={SpellDetailPage} />
      <Route path="/spells/:id/edit" component={SpellEditorPage} />
    </>
  );
}
