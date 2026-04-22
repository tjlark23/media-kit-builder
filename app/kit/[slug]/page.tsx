import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import ContactSection from "./ContactSection";

export const dynamic = "force-dynamic";

export default async function PublicKit({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data: kit } = await supabase
    .from("media_kits")
    .select("generated_html, is_published, name, form_data")
    .eq("slug", slug)
    .single();

  if (!kit || !kit.is_published || !kit.generated_html) {
    notFound();
  }

  const contactEmail = kit.form_data?.contactEmail || "";
  const kitName = kit.name || "";

  // Inject a script into the generated HTML that hijacks every "Get in Touch" path
  // to open the parent React modal instead of any in-iframe modal/section.
  const injectedScript = `
<script>
(function(){
  function openParentModal(){
    try { window.parent.postMessage({ type: 'openContactModal' }, '*'); } catch(e) {}
  }
  // Override any in-page modal openers so even inline onclick handlers route to the parent.
  window.openModal = openParentModal;
  window.closeModal = function(){};
  // Remove the in-iframe modal element entirely (supports both id conventions).
  ['contact-modal', 'modal'].forEach(function(id){
    var m = document.getElementById(id);
    if (m && m.parentNode) m.parentNode.removeChild(m);
  });
  // Catch buttons/links by label too, in case any path bypasses openModal.
  document.addEventListener('click', function(e) {
    var btn = e.target.closest('button, a');
    if (!btn) return;
    var text = (btn.textContent || '').trim().toUpperCase().replace(/[^A-Z ]/g, '').trim();
    var triggers = ['GET IN TOUCH', 'CONTACT US FOR RATES', 'LETS TALK', 'TALK TO US', 'PARTNER WITH US', 'START THE CONVERSATION', 'BOOK A CALL'];
    if (triggers.indexOf(text) !== -1) {
      e.preventDefault();
      e.stopPropagation();
      openParentModal();
      return false;
    }
  }, true);
})();
</script>`;

  const htmlWithInjection = kit.generated_html.replace(
    "</body>",
    injectedScript + "\n</body>"
  );

  return (
    <div style={{ background: "#111", minHeight: "100vh" }}>
      <iframe
        srcDoc={htmlWithInjection}
        style={{ width: "100%", height: "100vh", border: "none", display: "block" }}
        title={kit.name}
        id="kit-frame"
      />
      <ContactSection kitName={kitName} contactEmail={contactEmail} />
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data: kit } = await supabase
    .from("media_kits")
    .select("name")
    .eq("slug", slug)
    .single();
  return {
    title: kit?.name ? `${kit.name} - Media Kit` : "Media Kit",
  };
}
