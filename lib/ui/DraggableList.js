export default class DraggableList extends HTMLElement {
    // #region MAIN
    static observedAttributes = [];

    #listEl = null;
    #draggedIndex = null;

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        this.shadowRoot.innerHTML = `
        <style>
            :host{
                display: block;
            }

            ul {
                list-style: none;
                padding: 0;
                margin: 0;
                display: flex;
                flex-direction: column;
                gap: 0.25rem;
            }

            li {
                display: flex;
                align-items: center;
                padding: 0.5rem 0.75rem;
                background-color: var(--item-bg, #f4f4f5);
                border: 2px solid transparent;
                border-radius: 0.375rem;
                user-select: none;
                transition: border-color 150ms ease, background-color 150ms ease;

                &.drag-over {
                    border-color: var(--highlight-col, red);
                    background-color: var(--highlight-bg, red );
                }

                &.dragging {
                    opacity: 0.4;
                    background-color: green;
                }
            }

            .handle {
                cursor: grab;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 0.75rem;
                color: #71717a;

                & > svg {
                    width: 1.2rem;
                    height: 1.2rem;
                }

                &:active {
                    cursor: grabbing;
                }
            }

            .content {
                flex: 1;
            }
        </style>
        <ul id="container"></ul>`;

        this.#listEl = this.shadowRoot.querySelector('#container');


        this.#listEl.addEventListener('dragstart', (e) =>{
            console.log( 'START', e.target );

            console.log( e.target.closest( 'li' ) );
             e.target.closest( 'li' ).classList.add( 'dragging' );

             e.dataTransfer.setData('text/plain', 'yo');

             // Ghost Image Customization: If you want to change what the user visually drags around before dropping,
             // use e.dataTransfer.setDragImage(customElement, x, y)
        });

        this.#listEl.addEventListener('dragend', (e) =>{
            console.log( 'end', e.target );
            console.log( e.target.closest( 'li' ) );
             e.target.closest( 'li' ).classList.remove( 'dragging' );
        });


        this.#listEl.addEventListener('drop', (e) =>{
            console.log( 'DROP', e.target );

             console.log( 'Data', e.dataTransfer.getData('text/plain') );
        });

    }
    // #endregion

    // #region EVENT HANDLERS
    #onDragStart = (e, index) => {
        this.#draggedIndex = index;
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';

        console.log( e.target );
    };

    #onDragOver = (e) => {
        e.preventDefault(); // REQUIRED
        e.dataTransfer.dropEffect = 'move';
        const targetLi = e.currentTarget;

        if (parseInt(targetLi.dataset.index) !== this.#draggedIndex) {
            targetLi.classList.add('drag-over');
        }
    };

    #onDragLeave = (e) => {
        e.currentTarget.classList.remove('drag-over');
    };

    #onDrop = (e, dropIndex) => {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');

        if (this.#draggedIndex === null || this.#draggedIndex === dropIndex) return;

        // Reorder elements internally
        const items = Array.from(this.#listEl.children);
        const movedItem = items[this.#draggedIndex];

        if (this.#draggedIndex < dropIndex) {
            this.#listEl.insertBefore(movedItem, items[dropIndex].nextSibling);
        } else {
            this.#listEl.insertBefore(movedItem, items[dropIndex]);
        }

        // Update dataset indices
        this.#updateIndices();

        // Dispatch reorder event
        this.dispatchEvent(new CustomEvent('reorder', {
            bubbles: true,
            composed: true,
            detail: { items: this.getValue() }
        }));
    };

    #onDragEnd = (e) => {
        e.target.classList.remove('dragging');
        this.#draggedIndex = null;

        // Ensure all highlighters are cleared
        this.#listEl.querySelectorAll('li').forEach(li => li.classList.remove('drag-over'));
    };

    #updateIndices() {
        Array.from(this.#listEl.children).forEach((li, idx) => {
            li.dataset.index = idx;
        });
    }
    // #endregion

    // #region METHODS
    clear() {
        this.#listEl.innerHTML = '';
        return this;
    }

    loadArray(ary) {
        this.clear();

        ary.forEach((item, index) => {
            const li = document.createElement('li');
            li.dataset.index = index;

            li.innerHTML = `
                <div class="handle" draggable="true">⋮⋮</div>
                <div class="content">${item}</div>
            `;

            // Attach drag events to the <li> container
            const handle = li.querySelector('.handle');

            handle.addEventListener('dragstart', (e) => this.#onDragStart(e, parseInt(li.dataset.index)));
            li.addEventListener('dragover', this.#onDragOver);
            li.addEventListener('dragleave', this.#onDragLeave);
            li.addEventListener('drop', (e) => this.#onDrop(e, parseInt(li.dataset.index)));
            handle.addEventListener('dragend', this.#onDragEnd);

            this.#listEl.appendChild(li);
        });

        return this;
    }

    getValue() {
        return Array.from(this.#listEl.querySelectorAll('.content')).map(el => el.textContent);
    }
    // #endregion
}

customElements.define('draggable-list', DraggableList);
