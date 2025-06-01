export default {
  async fetch(request) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const search = url.search;

    if (pathname.startsWith('/los-rifateros')) {
      return Response.redirect(`https://rifa-lovable-produccion-netlify.netlify.app${search}`, 302);
    }

    return new Response('No encontrado', { status: 404 });
  }
};
