export default function FAQ() {
  return (
    <div>
      <h1>Preguntas frecuentes</h1>
      <div className="faq">
        <details>
          <summary>¿Qué es Inventario Interno?</summary>
          <p>
            Inventario Interno es una plataforma interna para la gestión de compras y ventas: catálogo
            con búsqueda y filtros, carrito de compras, pedidos, historial de transacciones y
            administración de productos.
          </p>
        </details>
        <details>
          <summary>¿Cómo funciona la compra?</summary>
          <p>
            Busca un producto en el catálogo, usa "Comprar ahora" o "Agregar al carro" y confirma la
            compra desde el carro. El stock se descontará al confirmar.
          </p>
        </details>
        <details>
          <summary>¿Puedo modificar el carro antes de comprar?</summary>
          <p>
            Sí: puedes aumentar o disminuir la cantidad de un producto en el carro y quitarlo antes
            de confirmar.
          </p>
        </details>
        <details>
          <summary>¿Dónde consulto mis pedidos y transacciones?</summary>
          <p>
            En la página de Pedidos o en el Historial de compras y transacciones, donde se guardan
            los pedidos realizados.
          </p>
        </details>
        <details>
          <summary>¿Cómo se actualiza el inventario?</summary>
          <p>
            El inventario se actualiza automáticamente al confirmar compras. Los administradores
            pueden ajustar el stock manualmente en Administrar productos.
          </p>
        </details>
        <details>
          <summary>¿Cómo puedo opinar sobre un producto?</summary>
          <p>
            Desde la página de detalle de un producto puedes dejar una calificación y un comentario.
          </p>
        </details>
        <details>
          <summary>¿Cómo contacto al soporte?</summary>
          <p>Internamente: interno@inventario.local.</p>
        </details>
      </div>
    </div>
  );
}
