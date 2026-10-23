import "@fontsource-variable/dm-sans";
import Header from "./components/header";
import Footer from "./components/footer";
import Recovery from "./components/recovery";
import "./globals.css";

// Shown for any address that matches no page. Most stray links point at
// Alzheimer's Access, so this uses its header and footer.
export default function NotFound() {
  return (
    <>
      <Header />
      <Recovery title="We couldn’t find this page">
        The link may have changed. You can start a new search below.
      </Recovery>
      <Footer />
    </>
  );
}
