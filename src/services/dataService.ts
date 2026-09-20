import {
  User,
  PurchaseRequest,
  RequestItem,
  Quote,
  PurchaseOrder,
  StockItem,
  StockMovement,
  Supplier,
  SupplierProposal,
  AuditLog,
  ApprovalRule,
  RequestStatus,
  OrderStatus,
} from '../types';

const STORAGE_KEY = 'compras365_database_v2';

interface DatabaseState {
  currentUser: User;
  users: User[];
  requests: PurchaseRequest[];
  quotes: Quote[];
  orders: PurchaseOrder[];
  stock: StockItem[];
  stockMovements: StockMovement[];
  suppliers: Supplier[];
  auditLogs: AuditLog[];
  approvalRules: ApprovalRule[];
  categories: string[];
}

const INITIAL_USERS: User[] = [
  {
    userId: 'usr-admin-1',
    email: 'larissa.carvalho@empresa.com.br',
    displayName: 'Larissa Carvalho',
    role: 'admin',
    status: 'approved',
    department: 'Diretoria Executiva',
    approvalLimit: 1000000,
    phone: '(11) 98888-1001',
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-01-10T08:00:00Z',
  },
  {
    userId: 'usr-buyer-1',
    email: 'carlos.compras@empresa.com.br',
    displayName: 'Carlos Mendes',
    role: 'buyer',
    status: 'approved',
    department: 'Suprimentos & Compras',
    approvalLimit: 5000,
    phone: '(11) 98888-1002',
    createdAt: '2026-01-15T09:00:00Z',
    updatedAt: '2026-01-15T09:00:00Z',
  },
  {
    userId: 'usr-appr-1',
    email: 'mariana.gerente@empresa.com.br',
    displayName: 'Mariana Rocha',
    role: 'approver',
    status: 'approved',
    department: 'Operações e TI',
    approvalLimit: 30000,
    phone: '(11) 98888-1003',
    createdAt: '2026-01-20T10:00:00Z',
    updatedAt: '2026-01-20T10:00:00Z',
  },
  {
    userId: 'usr-collab-1',
    email: 'roberto.engenharia@empresa.com.br',
    displayName: 'Roberto Dias',
    role: 'collaborator',
    status: 'approved',
    department: 'Engenharia de Software',
    approvalLimit: 0,
    phone: '(11) 98888-1004',
    createdAt: '2026-02-01T11:00:00Z',
    updatedAt: '2026-02-01T11:00:00Z',
  },
  {
    userId: 'usr-stock-1',
    email: 'marcos.almox@empresa.com.br',
    displayName: 'Marcos Vinicius',
    role: 'stock_manager',
    status: 'approved',
    department: 'Almoxarifado & Logística',
    approvalLimit: 2000,
    phone: '(11) 98888-1005',
    createdAt: '2026-02-05T12:00:00Z',
    updatedAt: '2026-02-05T12:00:00Z',
  },
  {
    userId: 'usr-pending-1',
    email: 'joao.lucas@empresa.com.br',
    displayName: 'João Lucas (Novo)',
    role: 'collaborator',
    status: 'pending',
    department: 'Marketing',
    approvalLimit: 0,
    phone: '(11) 97777-9999',
    createdAt: '2026-09-15T14:30:00Z',
    updatedAt: '2026-09-15T14:30:00Z',
  },
];

const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 'sup-1',
    corporateName: 'TechSupply Brasil Distribuidora S.A.',
    tradeName: 'TechSupply Brasil',
    cnpj: '18.234.567/0001-89',
    email: 'comercial@techsupply.com.br',
    phone: '(11) 4004-9200',
    contactPerson: 'Juliana Prado',
    category: 'Hardware & TI',
    city: 'São Paulo',
    state: 'SP',
    rating: 4.8,
    active: true,
    paymentTermsDefault: '28 dias (Boleto)',
    createdAt: '2026-01-10T10:00:00Z',
  },
  {
    id: 'sup-2',
    corporateName: 'EletroPower Distribuidora de Energia Ltda',
    tradeName: 'EletroPower Soluções',
    cnpj: '22.987.654/0001-12',
    email: 'vendas@eletropower.com.br',
    phone: '(19) 3880-1122',
    contactPerson: 'Fernando Silva',
    category: 'Elétrica & Infraestrutura',
    city: 'Campinas',
    state: 'SP',
    rating: 4.9,
    active: true,
    paymentTermsDefault: '30/60 dias',
    createdAt: '2026-01-15T10:00:00Z',
  },
  {
    id: 'sup-3',
    corporateName: 'MegaInfo Soluções e Serviços TI Ltda',
    tradeName: 'MegaInfo Brasil',
    cnpj: '07.456.123/0001-44',
    email: 'cotacoes@megainfo.com.br',
    phone: '(11) 3221-5500',
    contactPerson: 'Renata Castro',
    category: 'Hardware & TI',
    city: 'São Paulo',
    state: 'SP',
    rating: 4.2,
    active: true,
    paymentTermsDefault: 'À Vista com 5% desc.',
    createdAt: '2026-01-20T10:00:00Z',
  },
  {
    id: 'sup-4',
    corporateName: 'Papelex Suprimentos Corporativos Eireli',
    tradeName: 'Papelex Corporativo',
    cnpj: '33.111.222/0001-55',
    email: 'empresas@papelex.com.br',
    phone: '(11) 2990-3344',
    contactPerson: 'Bruno Ramos',
    category: 'Papelaria & Almoxarifado',
    city: 'Barueri',
    state: 'SP',
    rating: 4.6,
    active: true,
    paymentTermsDefault: '15 dias',
    createdAt: '2026-01-25T10:00:00Z',
  },
  {
    id: 'sup-5',
    corporateName: 'ErgoComfort Mobiliário Profissional Ltda',
    tradeName: 'ErgoComfort Móveis',
    cnpj: '44.555.666/0001-77',
    email: 'vendas@ergocomfort.com.br',
    phone: '(41) 3340-7788',
    contactPerson: 'Camila Zanetti',
    category: 'Mobiliário & Escritório',
    city: 'Curitiba',
    state: 'PR',
    rating: 4.7,
    active: true,
    paymentTermsDefault: '30 dias',
    createdAt: '2026-02-01T10:00:00Z',
  },
];

const INITIAL_STOCK_CATEGORIES: string[] = [
  'TI & Infra',
  'Elétrica & Iluminação',
  'Hidráulica',
  'EPIs & Segurança',
  'Escritório & Papelaria',
  'Limpeza & Higiene',
  'Manutenção & Ferramentas',
  'Matéria-Prima',
  'Embalagens',
  'Peças Automotivas',
  'Mobiliário',
  'Geral',
];

const INITIAL_STOCK: StockItem[] = [
  {
    id: 'stk-1',
    code: 'MAT-001',
    sku: 'MAT-001',
    name: 'Nobreak Senoidal 1500VA Bivolt',
    description: 'Nobreak Senoidal 1500VA Bivolt',
    category: 'TI & Infra',
    unit: 'UN',
    currentStock: 1,
    minStock: 3,
    maxStock: 8,
    averageCost: 1150.0,
    avgCost: 1150.0,
    location: 'Corredor A - Prateleira 2',
    lastRestockDate: '2026-08-10',
    createdAt: '2026-01-10T10:00:00Z',
    updatedAt: '2026-08-10T10:00:00Z',
  },
  {
    id: 'stk-2',
    code: 'MAT-002',
    sku: 'MAT-002',
    name: 'Cabo de Rede UTP Cat6 305m Azul',
    description: 'Cabo de Rede UTP Cat6 305m Azul',
    category: 'Redes',
    unit: 'CX',
    currentStock: 1,
    minStock: 4,
    maxStock: 10,
    averageCost: 480.0,
    avgCost: 480.0,
    location: 'Corredor A - Prateleira 4',
    lastRestockDate: '2026-07-15',
    createdAt: '2026-01-10T10:00:00Z',
    updatedAt: '2026-07-15T10:00:00Z',
  },
  {
    id: 'stk-3',
    code: 'MAT-003',
    sku: 'MAT-003',
    name: 'Bobina Térmica 80mm x 40m Amarela',
    description: 'Bobina Térmica 80mm x 40m Amarela',
    category: 'Suprimentos',
    unit: 'PCT',
    currentStock: 12,
    minStock: 25,
    maxStock: 80,
    averageCost: 35.0,
    avgCost: 35.0,
    location: 'Corredor B - Prateleira 1',
    lastRestockDate: '2026-08-28',
    createdAt: '2026-01-12T10:00:00Z',
    updatedAt: '2026-08-28T10:00:00Z',
  },
  {
    id: 'stk-4',
    code: 'MAT-004',
    sku: 'MAT-004',
    name: 'Cadeira Ergonômica Presidente NR-17',
    description: 'Cadeira Ergonômica Presidente NR-17',
    category: 'Mobiliário',
    unit: 'UN',
    currentStock: 0,
    minStock: 4,
    maxStock: 12,
    averageCost: 950.0,
    avgCost: 950.0,
    location: 'Galpão de Móveis - Setor D',
    lastRestockDate: '2026-06-01',
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-06-01T10:00:00Z',
  },
  {
    id: 'stk-5',
    code: 'MAT-005',
    sku: 'MAT-005',
    name: 'Luva Nitrílica Descartável Tamanho G (Caixa c/ 100)',
    description: 'Luva Nitrílica Descartável Tamanho G (Caixa c/ 100)',
    category: 'EPI & Segurança',
    unit: 'CX',
    currentStock: 45,
    minStock: 20,
    maxStock: 60,
    averageCost: 42.5,
    avgCost: 42.5,
    location: 'Corredor C - Armário 3',
    lastRestockDate: '2026-09-02',
    createdAt: '2026-01-20T10:00:00Z',
    updatedAt: '2026-09-02T10:00:00Z',
  },
  {
    id: 'stk-6',
    code: 'MAT-006',
    sku: 'MAT-006',
    name: 'Teclado e Mouse Sem Fio ABNT2 USB',
    description: 'Teclado e Mouse Sem Fio ABNT2 USB',
    category: 'TI & Acessórios',
    unit: 'KIT',
    currentStock: 8,
    minStock: 6,
    maxStock: 20,
    averageCost: 125.0,
    avgCost: 125.0,
    location: 'Corredor A - Gaveteiro 1',
    lastRestockDate: '2026-08-20',
    createdAt: '2026-02-01T10:00:00Z',
    updatedAt: '2026-08-20T10:00:00Z',
  },
];

const INITIAL_REQUESTS: PurchaseRequest[] = [
  {
    id: 'req-1',
    code: 'SOL-2026-001',
    requesterId: 'usr-collab-1',
    requesterName: 'Roberto Dias',
    requesterEmail: 'roberto.engenharia@empresa.com.br',
    department: 'Engenharia de Software',
    justification: 'Reposição crítica de nobreaks para os servidores locais de compilação e bancada.',
    urgency: 'high',
    status: 'quoting',
    estimatedTotal: 6500.0,
    quoteId: 'quot-1',
    items: [
      {
        id: 'item-1',
        description: 'Nobreak Senoidal 1500VA Bivolt c/ bateria externa',
        quantity: 5,
        unit: 'UN',
        estimatedUnitPrice: 1300.0,
        stockItemId: 'stk-1',
        notes: 'Marca SMS ou Ragtech homologada',
      },
    ],
    createdAt: '2026-09-10T11:20:00Z',
    updatedAt: '2026-09-11T09:30:00Z',
  },
  {
    id: 'req-2',
    code: 'SOL-2026-002',
    requesterId: 'usr-collab-1',
    requesterName: 'Roberto Dias',
    requesterEmail: 'roberto.engenharia@empresa.com.br',
    department: 'Engenharia de Software',
    justification: 'Novas cadeiras ergonômicas NR-17 para expansão da equipe de produtos digitais.',
    urgency: 'medium',
    status: 'pending_approval',
    estimatedTotal: 7600.0,
    quoteId: 'quot-2',
    items: [
      {
        id: 'item-2-1',
        description: 'Cadeira Ergonômica Presidente NR-17 com braços 3D e apoio lombar',
        quantity: 8,
        unit: 'UN',
        estimatedUnitPrice: 950.0,
        stockItemId: 'stk-4',
      },
    ],
    createdAt: '2026-09-12T14:10:00Z',
    updatedAt: '2026-09-14T16:00:00Z',
  },
  {
    id: 'req-3',
    code: 'SOL-2026-003',
    requesterId: 'usr-stock-1',
    requesterName: 'Marcos Vinicius',
    requesterEmail: 'marcos.almox@empresa.com.br',
    department: 'Almoxarifado & Logística',
    justification: 'Reposição automática de estoque mínimo de bobinas térmicas de checkout e expedição.',
    urgency: 'urgent',
    status: 'ordered',
    estimatedTotal: 1400.0,
    orderId: 'ord-1',
    items: [
      {
        id: 'item-3-1',
        description: 'Bobina Térmica 80mm x 40m Amarela (Pct com 30)',
        quantity: 40,
        unit: 'PCT',
        estimatedUnitPrice: 35.0,
        stockItemId: 'stk-3',
      },
    ],
    createdAt: '2026-09-05T08:30:00Z',
    updatedAt: '2026-09-07T11:00:00Z',
  },
  {
    id: 'req-4',
    code: 'SOL-2026-004',
    requesterId: 'usr-collab-1',
    requesterName: 'Roberto Dias',
    requesterEmail: 'roberto.engenharia@empresa.com.br',
    department: 'Engenharia de Software',
    justification: 'Cabos Cat6 para cabeamento estruturado da nova sala de reuniões executivas.',
    urgency: 'medium',
    status: 'pending_quote',
    estimatedTotal: 1920.0,
    items: [
      {
        id: 'item-4-1',
        description: 'Cabo de Rede UTP Cat6 305m Azul Puro Cobre',
        quantity: 4,
        unit: 'CX',
        estimatedUnitPrice: 480.0,
        stockItemId: 'stk-2',
      },
    ],
    createdAt: '2026-09-16T15:45:00Z',
    updatedAt: '2026-09-16T15:45:00Z',
  },
];

const INITIAL_QUOTES: Quote[] = [
  {
    id: 'quot-1',
    code: 'COT-2026-001',
    requestId: 'req-1',
    requestCode: 'SOL-2026-001',
    requestCodes: ['SOL-2026-001'],
    buyerId: 'usr-buyer-1',
    buyerName: 'Carlos Mendes',
    status: 'in_progress',
    awardedMode: 'total',
    estimatedTotal: 6500.0,
    totalAmount: 5600.0,
    savingAmount: 1400.0, // Comparing to highest bid (7000)
    savingPercent: 20.0,
    selectedSupplierId: 'sup-2',
    winnerSupplierId: 'sup-2',
    winnerSupplierName: 'EletroPower Soluções',
    notes: 'EletroPower ofereceu o melhor valor unitário e entrega em 3 dias úteis.',
    items: [
      {
        id: 'item-1',
        description: 'Nobreak Senoidal 1500VA Bivolt c/ bateria externa',
        quantity: 5,
        unit: 'UN',
        estimatedUnitPrice: 1300.0,
        stockItemId: 'stk-1',
        notes: 'Marca SMS ou Ragtech homologada',
      },
    ],
    proposals: [
      {
        id: 'prop-1-1',
        supplierId: 'sup-1',
        supplierName: 'TechSupply Brasil',
        supplierCnpj: '18.234.567/0001-89',
        paymentTerms: '28 dias',
        freightCost: 0,
        deliveryDays: 5,
        totalAmount: 6250.0,
        notes: 'Frete grátis para SP capital',
        items: [
          {
            itemId: 'item-1',
            unitPrice: 1250.0,
            totalPrice: 6250.0,
            brand: 'Ragtech Senoidal',
            deliveryDays: 5,
          },
        ],
      },
      {
        id: 'prop-1-2',
        supplierId: 'sup-2',
        supplierName: 'EletroPower Soluções',
        supplierCnpj: '22.987.654/0001-12',
        paymentTerms: '30/60 dias',
        freightCost: 0,
        deliveryDays: 3,
        totalAmount: 5600.0,
        notes: 'Garantia de 2 anos pelo fabricante',
        items: [
          {
            itemId: 'item-1',
            unitPrice: 1120.0,
            totalPrice: 5600.0,
            brand: 'SMS Mirage Senoidal',
            deliveryDays: 3,
          },
        ],
      },
      {
        id: 'prop-1-3',
        supplierId: 'sup-3',
        supplierName: 'MegaInfo Brasil',
        supplierCnpj: '07.456.123/0001-44',
        paymentTerms: 'À vista',
        freightCost: 150.0,
        deliveryDays: 2,
        totalAmount: 7150.0,
        notes: 'Disponível pronta entrega',
        items: [
          {
            itemId: 'item-1',
            unitPrice: 1400.0,
            totalPrice: 7000.0,
            brand: 'APC Smart-UPS',
            deliveryDays: 2,
          },
        ],
      },
    ],
    bids: [
      {
        supplierId: 'sup-1',
        supplierName: 'TechSupply Brasil',
        supplierCnpj: '18.234.567/0001-89',
        paymentTerms: '28 dias',
        freightCost: 0,
        validUntil: '2026-09-25',
        notes: 'Frete grátis para SP capital',
        itemPrices: {
          'item-1': {
            itemId: 'item-1',
            unitPrice: 1250.0,
            availableQuantity: 5,
            brand: 'Ragtech Senoidal',
            deliveryDays: 5,
          },
        },
      },
      {
        supplierId: 'sup-2',
        supplierName: 'EletroPower Soluções',
        supplierCnpj: '22.987.654/0001-12',
        paymentTerms: '30/60 dias',
        freightCost: 0,
        validUntil: '2026-09-28',
        notes: 'Garantia de 2 anos pelo fabricante',
        itemPrices: {
          'item-1': {
            itemId: 'item-1',
            unitPrice: 1120.0,
            availableQuantity: 5,
            brand: 'SMS Mirage Senoidal',
            deliveryDays: 3,
          },
        },
      },
      {
        supplierId: 'sup-3',
        supplierName: 'MegaInfo Brasil',
        supplierCnpj: '07.456.123/0001-44',
        paymentTerms: 'À vista',
        freightCost: 150.0,
        validUntil: '2026-09-22',
        notes: 'Disponível pronta entrega',
        itemPrices: {
          'item-1': {
            itemId: 'item-1',
            unitPrice: 1400.0,
            availableQuantity: 5,
            brand: 'APC Smart-UPS',
            deliveryDays: 2,
          },
        },
      },
    ],
    createdAt: '2026-09-11T09:30:00Z',
    updatedAt: '2026-09-15T16:20:00Z',
  },
  {
    id: 'quot-2',
    code: 'COT-2026-002',
    requestId: 'req-2',
    requestCode: 'SOL-2026-002',
    requestCodes: ['SOL-2026-002'],
    buyerId: 'usr-buyer-1',
    buyerName: 'Carlos Mendes',
    status: 'pending_approval',
    awardedMode: 'total',
    estimatedTotal: 7600.0,
    totalAmount: 6880.0,
    savingAmount: 720.0,
    savingPercent: 9.5,
    selectedSupplierId: 'sup-5',
    winnerSupplierId: 'sup-5',
    winnerSupplierName: 'ErgoComfort Móveis',
    notes: 'ErgoComfort tem laudo ergonômico NR-17 emitido e garantia de 5 anos na estrutura.',
    items: [
      {
        id: 'item-2-1',
        description: 'Cadeira Ergonômica Presidente NR-17 com apoio de cabeça',
        quantity: 8,
        unit: 'UN',
        estimatedUnitPrice: 950.0,
        stockItemId: 'stk-4',
        notes: 'Braços reguláveis 3D e mecanismo Relax com trava',
      },
    ],
    proposals: [
      {
        id: 'prop-2-1',
        supplierId: 'sup-5',
        supplierName: 'ErgoComfort Móveis',
        supplierCnpj: '44.555.666/0001-77',
        paymentTerms: '30 dias',
        freightCost: 120.0,
        deliveryDays: 10,
        totalAmount: 6880.0,
        items: [
          {
            itemId: 'item-2-1',
            unitPrice: 845.0,
            totalPrice: 6760.0,
            brand: 'Cavaletti Yon NR-17',
            deliveryDays: 10,
          },
        ],
      },
      {
        id: 'prop-2-2',
        supplierId: 'sup-4',
        supplierName: 'Papelex Corporativo',
        supplierCnpj: '33.111.222/0001-55',
        paymentTerms: '15 dias',
        freightCost: 0,
        deliveryDays: 12,
        totalAmount: 7600.0,
        items: [
          {
            itemId: 'item-2-1',
            unitPrice: 950.0,
            totalPrice: 7600.0,
            brand: 'Plaxmetal Brizza',
            deliveryDays: 12,
          },
        ],
      },
    ],
    bids: [
      {
        supplierId: 'sup-5',
        supplierName: 'ErgoComfort Móveis',
        supplierCnpj: '44.555.666/0001-77',
        paymentTerms: '30 dias',
        freightCost: 120.0,
        validUntil: '2026-09-30',
        itemPrices: {
          'item-2-1': {
            itemId: 'item-2-1',
            unitPrice: 845.0,
            availableQuantity: 8,
            brand: 'Cavaletti Yon NR-17',
            deliveryDays: 10,
          },
        },
      },
      {
        supplierId: 'sup-4',
        supplierName: 'Papelex Corporativo',
        supplierCnpj: '33.111.222/0001-55',
        paymentTerms: '15 dias',
        freightCost: 0,
        validUntil: '2026-09-25',
        itemPrices: {
          'item-2-1': {
            itemId: 'item-2-1',
            unitPrice: 950.0,
            availableQuantity: 8,
            brand: 'Plaxmetal Brizza',
            deliveryDays: 12,
          },
        },
      },
    ],
    createdAt: '2026-09-13T10:00:00Z',
    updatedAt: '2026-09-14T16:00:00Z',
  },
];

const INITIAL_ORDERS: PurchaseOrder[] = [
  {
    id: 'ord-1',
    orderNumber: 'PED-2026-001',
    requestId: 'req-3',
    supplierId: 'sup-4',
    supplierName: 'Papelex Corporativo',
    supplierCnpj: '33.111.222/0001-55',
    supplierEmail: 'empresas@papelex.com.br',
    supplierPhone: '(11) 2990-3344',
    buyerId: 'usr-buyer-1',
    buyerName: 'Carlos Mendes',
    approverId: 'usr-admin-1',
    approverName: 'Larissa Carvalho',
    status: 'issued',
    totalAmount: 1360.0,
    freightCost: 0,
    paymentTerms: '15 dias (Boleto)',
    deliveryDeadline: '2026-09-20',
    deliveryAddress: 'Av. Paulista, 1000, 12º andar - Almoxarifado Central - São Paulo/SP',
    items: [
      {
        id: 'ord-item-1',
        description: 'Bobina Térmica 80mm x 40m Amarela (Pct com 30)',
        quantity: 40,
        receivedQuantity: 0,
        unit: 'PCT',
        unitPrice: 34.0,
        totalPrice: 1360.0,
        stockItemId: 'stk-3',
      },
    ],
    notes: 'Entregas devem ser feitas em horário comercial entre 08h e 17h.',
    createdAt: '2026-09-07T11:00:00Z',
    updatedAt: '2026-09-07T11:00:00Z',
  },
  {
    id: 'ord-2',
    orderNumber: 'PED-2026-002',
    supplierId: 'sup-1',
    supplierName: 'TechSupply Brasil',
    supplierCnpj: '18.234.567/0001-89',
    supplierEmail: 'comercial@techsupply.com.br',
    supplierPhone: '(11) 4004-9200',
    buyerId: 'usr-buyer-1',
    buyerName: 'Carlos Mendes',
    approverId: 'usr-appr-1',
    approverName: 'Mariana Rocha',
    status: 'received',
    totalAmount: 2500.0,
    freightCost: 0,
    paymentTerms: '28 dias',
    deliveryDeadline: '2026-09-01',
    deliveryAddress: 'Av. Paulista, 1000, 12º andar - São Paulo/SP',
    invoiceNumber: '004921',
    invoiceKey: '35260818234567000189550010000049211004829103',
    invoiceDate: '2026-08-30',
    items: [
      {
        id: 'ord-item-2',
        description: 'Teclado e Mouse Sem Fio ABNT2 USB (Kit 20 un)',
        quantity: 20,
        receivedQuantity: 20,
        unit: 'KIT',
        unitPrice: 125.0,
        totalPrice: 2500.0,
        stockItemId: 'stk-6',
      },
    ],
    notes: 'Material recebido e conferido pelo almoxarifado em conformidade com o pedido.',
    createdAt: '2026-08-25T14:00:00Z',
    updatedAt: '2026-08-30T16:00:00Z',
  },
];

const INITIAL_STOCK_MOVEMENTS: StockMovement[] = [
  {
    id: 'mov-1',
    itemId: 'stk-6',
    itemName: 'Teclado e Mouse Sem Fio ABNT2 USB',
    type: 'in',
    quantity: 20,
    previousStock: 0,
    newStock: 20,
    referenceType: 'purchase_order',
    referenceId: 'ord-2',
    invoiceNumber: '004921',
    performedBy: 'usr-stock-1',
    performedByName: 'Marcos Vinicius',
    department: 'Almoxarifado & Logística',
    notes: 'Recebimento físico de material via Pedido PED-2026-002 e NF 004921.',
    createdAt: '2026-08-30T16:15:00Z',
  },
  {
    id: 'mov-2',
    itemId: 'stk-6',
    itemName: 'Teclado e Mouse Sem Fio ABNT2 USB',
    type: 'out',
    quantity: 12,
    previousStock: 20,
    newStock: 8,
    referenceType: 'requisition',
    referenceId: 'REQ-MAT-01',
    performedBy: 'usr-stock-1',
    performedByName: 'Marcos Vinicius',
    department: 'Engenharia de Software',
    notes: 'Distribuição para novos colaboradores de desenvolvimento.',
    createdAt: '2026-09-02T10:00:00Z',
  },
];

const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-1',
    userId: 'usr-admin-1',
    userEmail: 'larissa.carvalho@empresa.com.br',
    userName: 'Larissa Carvalho',
    userRole: 'admin',
    action: 'USUARIO_CRIADO',
    entity: 'User',
    entityId: 'usr-buyer-1',
    details: 'Criação da conta do comprador Carlos Mendes com alçada de R$ 5.000.',
    createdAt: '2026-01-15T09:00:00Z',
  },
  {
    id: 'log-2',
    userId: 'usr-collab-1',
    userEmail: 'roberto.engenharia@empresa.com.br',
    userName: 'Roberto Dias',
    userRole: 'collaborator',
    action: 'SOLICITACAO_CRIADA',
    entity: 'PurchaseRequest',
    entityId: 'req-1',
    details: 'Solicitação SOL-2026-001 criada com urgência alta para nobreaks.',
    createdAt: '2026-09-10T11:20:00Z',
  },
  {
    id: 'log-3',
    userId: 'usr-buyer-1',
    userEmail: 'carlos.compras@empresa.com.br',
    userName: 'Carlos Mendes',
    userRole: 'buyer',
    action: 'COTACAO_INICIADA',
    entity: 'Quote',
    entityId: 'quot-1',
    details: 'Iniciada cotação comparativa COT-2026-001 com 3 fornecedores homologados.',
    createdAt: '2026-09-11T09:30:00Z',
  },
  {
    id: 'log-4',
    userId: 'usr-buyer-1',
    userEmail: 'carlos.compras@empresa.com.br',
    userName: 'Carlos Mendes',
    userRole: 'buyer',
    action: 'PEDIDO_EMITIDO',
    entity: 'PurchaseOrder',
    entityId: 'ord-1',
    details: 'Emissão oficial do pedido de compra PED-2026-001 para Papelex Corporativo.',
    createdAt: '2026-09-07T11:00:00Z',
  },
];

const INITIAL_APPROVAL_RULES: ApprovalRule[] = [
  {
    id: 'rule-1',
    levelName: 'Nível 1 - Compras Operacionais',
    maxAmount: 2500,
    requiredRole: 'buyer',
    description: 'Valores até R$ 2.500 podem ser aprovados pelo próprio Comprador responsável.',
  },
  {
    id: 'rule-2',
    levelName: 'Nível 2 - Gerência de Suprimentos / Área',
    maxAmount: 30000,
    requiredRole: 'approver',
    description: 'Valores entre R$ 2.500 e R$ 30.000 exigem aprovação do Gerente de Operações.',
  },
  {
    id: 'rule-3',
    levelName: 'Nível 3 - Diretoria Executiva',
    maxAmount: 999999999,
    requiredRole: 'admin',
    description: 'Valores acima de R$ 30.000 exigem aprovação de Diretor / Administrador Geral.',
  },
];

class DataService {
  private state: DatabaseState;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): DatabaseState {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.users && parsed.requests && parsed.currentUser) {
          // Self-heal quotes that might be missing items or proposals
          if (Array.isArray(parsed.quotes) && Array.isArray(parsed.requests)) {
            parsed.quotes.forEach((q: Quote) => {
              if (!q.items || q.items.length === 0) {
                const matchedReq = parsed.requests.find(
                  (r: PurchaseRequest) => r.id === q.requestId || r.code === q.requestCode || (q.requestCodes && q.requestCodes.includes(r.code))
                );
                if (matchedReq && matchedReq.items && matchedReq.items.length > 0) {
                  q.items = matchedReq.items.map((it: any) => ({ ...it }));
                }
              }
              // Ensure all proposals have item entries for all quote items
              if (Array.isArray(q.proposals) && Array.isArray(q.items)) {
                q.proposals.forEach((p: SupplierProposal) => {
                  if (!p.items) p.items = [];
                  q.items!.forEach((it) => {
                    const existingItem = p.items.find((pi: any) => pi.itemId === it.id);
                    if (!existingItem) {
                      p.items.push({
                        itemId: it.id,
                        description: it.description,
                        quantity: it.quantity,
                        unit: it.unit,
                        unitPrice: 0,
                        totalPrice: 0,
                      });
                    }
                  });
                });
              }
            });
          }
          if (!parsed.categories || !Array.isArray(parsed.categories) || parsed.categories.length === 0) {
            const fromStock = (parsed.stock || []).map((s: StockItem) => s.category).filter(Boolean);
            parsed.categories = Array.from(new Set([...INITIAL_STOCK_CATEGORIES, ...fromStock]));
          }
          return parsed;
        }
      }
    } catch {
      // ignore
    }

    const defaultState: DatabaseState = {
      currentUser: INITIAL_USERS[0], // Default: Larissa Carvalho (Admin)
      users: INITIAL_USERS,
      requests: INITIAL_REQUESTS,
      quotes: INITIAL_QUOTES,
      orders: INITIAL_ORDERS,
      stock: INITIAL_STOCK,
      stockMovements: INITIAL_STOCK_MOVEMENTS,
      suppliers: INITIAL_SUPPLIERS,
      auditLogs: INITIAL_AUDIT_LOGS,
      approvalRules: INITIAL_APPROVAL_RULES,
      categories: Array.from(new Set([...INITIAL_STOCK_CATEGORIES, ...INITIAL_STOCK.map((s) => s.category)])),
    };
    this.saveState(defaultState);
    return defaultState;
  }

  private saveState(state: DatabaseState): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Falha ao salvar no storage local', e);
    }
  }

  private notify(): void {
    this.saveState(this.state);
    this.listeners.forEach((fn) => fn());
  }

  public subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  // Current User / Session Simulation
  public getCurrentUser(): User {
    return this.state.currentUser;
  }

  public setCurrentUser(userId: string): void {
    const user = this.state.users.find((u) => u.userId === userId);
    if (user) {
      this.state.currentUser = user;
      this.appendAudit(
        'SESSAO_ALTERADA',
        'User',
        userId,
        `Usuário ativo alternado para ${user.displayName} (${user.role}).`
      );
      this.notify();
    }
  }

  // Users Management
  public getUsers(): User[] {
    return [...this.state.users];
  }

  public updateUserRoleAndStatus(
    targetUserId: string,
    role: User['role'],
    status: User['status'],
    approvalLimit: number
  ): void {
    const admin = this.state.currentUser;
    if (admin.role !== 'admin') {
      throw new Error('Apenas Administradores podem alterar perfis e alçadas de usuários.');
    }

    const userIndex = this.state.users.findIndex((u) => u.userId === targetUserId);
    if (userIndex === -1) return;

    const oldUser = this.state.users[userIndex];
    this.state.users[userIndex] = {
      ...oldUser,
      role,
      status,
      approvalLimit,
      updatedAt: new Date().toISOString(),
    };

    if (this.state.currentUser.userId === targetUserId) {
      this.state.currentUser = this.state.users[userIndex];
    }

    this.appendAudit(
      'PERFIL_USUARIO_ATUALIZADO',
      'User',
      targetUserId,
      `Perfil de ${oldUser.displayName} atualizado: cargo ${role}, status ${status}, alçada R$ ${approvalLimit}.`
    );
    this.notify();
  }

  // Audit Logs (Immutable, append-only)
  public getAuditLogs(): AuditLog[] {
    return [...this.state.auditLogs].sort(
      (a, b) => new Date(b.createdAt || b.timestamp || 0).getTime() - new Date(a.createdAt || a.timestamp || 0).getTime()
    );
  }

  private appendAudit(action: string, entity: string, entityId: string, details: string): void {
    const user = this.state.currentUser;
    const newLog: AuditLog = {
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      userId: user.userId,
      userEmail: user.email,
      userName: user.displayName,
      userRole: user.role,
      action,
      entity,
      entityId,
      details,
      createdAt: new Date().toISOString(),
    };
    this.state.auditLogs.unshift(newLog);
  }

  // Requests
  public getRequests(): PurchaseRequest[] {
    return [...this.state.requests].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public getRequestById(id: string): PurchaseRequest | undefined {
    return this.state.requests.find((r) => r.id === id);
  }

  public createRequest(data: Omit<PurchaseRequest, 'id' | 'code' | 'createdAt' | 'updatedAt' | 'requesterId' | 'requesterName' | 'requesterEmail'>): PurchaseRequest {
    const user = this.state.currentUser;
    if (user.status !== 'approved') {
      throw new Error('Usuário sem autorização de acesso ao sistema.');
    }

    const nextNumber = this.state.requests.length + 1;
    const code = `SOL-2026-${String(nextNumber).padStart(3, '0')}`;
    const newReq: PurchaseRequest = {
      ...data,
      id: 'req-' + Date.now(),
      code,
      requesterId: user.userId,
      requesterName: user.displayName,
      requesterEmail: user.email,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.state.requests.unshift(newReq);
    this.appendAudit(
      'SOLICITACAO_CRIADA',
      'PurchaseRequest',
      newReq.id,
      `Solicitação ${code} criada com ${newReq.items.length} itens no valor estimado de R$ ${newReq.estimatedTotal.toFixed(2)}.`
    );
    this.notify();
    return newReq;
  }

  public updateRequestStatus(requestId: string, status: RequestStatus, comment?: string): void {
    const req = this.state.requests.find((r) => r.id === requestId);
    if (!req) return;

    const oldStatus = req.status;
    req.status = status;
    req.updatedAt = new Date().toISOString();
    if (comment) {
      req.approvalComment = comment;
    }

    this.appendAudit(
      'STATUS_SOLICITACAO_ALTERADO',
      'PurchaseRequest',
      requestId,
      `Solicitação ${req.code} teve status alterado de ${oldStatus} para ${status}.`
    );
    this.notify();
  }

  // Quotes
  public getQuotes(): Quote[] {
    return [...this.state.quotes].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public getQuoteById(id: string): Quote | undefined {
    return this.state.quotes.find((q) => q.id === id);
  }

  public createQuoteForRequest(requestId: string): Quote {
    const user = this.state.currentUser;
    if (user.role !== 'buyer' && user.role !== 'admin') {
      throw new Error('Apenas compradores e administradores podem iniciar cotações.');
    }

    const req = this.state.requests.find((r) => r.id === requestId);
    if (!req) throw new Error('Solicitação não encontrada.');

    const nextNumber = this.state.quotes.length + 1;
    const code = `COT-2026-${String(nextNumber).padStart(3, '0')}`;

    const quoteItems: RequestItem[] = (req.items || []).map((it) => ({
      ...it,
    }));

    const newQuote: Quote = {
      id: 'quot-' + Date.now(),
      code,
      requestId: req.id,
      requestCode: req.code,
      requestCodes: [req.code],
      buyerId: user.userId,
      buyerName: user.displayName,
      status: 'in_progress',
      awardedMode: 'total',
      estimatedTotal: req.estimatedTotal,
      totalAmount: 0,
      savingAmount: 0,
      savingPercent: 0,
      items: quoteItems,
      proposals: [],
      bids: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    req.status = 'quoting';
    req.quoteId = newQuote.id;
    req.updatedAt = new Date().toISOString();

    this.state.quotes.unshift(newQuote);
    this.appendAudit(
      'COTACAO_INICIADA',
      'Quote',
      newQuote.id,
      `Cotação ${code} aberta para a solicitação ${req.code}.`
    );
    this.notify();
    return newQuote;
  }

  public saveQuote(quote: Quote): void {
    const index = this.state.quotes.findIndex((q) => q.id === quote.id);
    if (index === -1) return;

    this.state.quotes[index] = {
      ...quote,
      updatedAt: new Date().toISOString(),
    };

    this.appendAudit(
      'COTACAO_ATUALIZADA',
      'Quote',
      quote.id,
      `Cotação ${quote.code} atualizada (vencedor: ${quote.selectedSupplierId || 'Nenhum'}, valor: R$ ${quote.totalAmount.toFixed(2)}).`
    );
    this.notify();
  }

  public sendQuoteForApproval(quoteId: string): void {
    const quote = this.state.quotes.find((q) => q.id === quoteId);
    if (!quote) return;

    if (!quote.selectedSupplierId && quote.awardedMode === 'total') {
      throw new Error('Selecione um fornecedor vencedor antes de enviar para aprovação.');
    }

    quote.status = 'pending_approval';
    quote.updatedAt = new Date().toISOString();

    const req = this.state.requests.find((r) => r.id === quote.requestId);
    if (req) {
      req.status = 'pending_approval';
      req.updatedAt = new Date().toISOString();
    }

    this.appendAudit(
      'COTACAO_ENVIADA_APROVACAO',
      'Quote',
      quoteId,
      `Cotação ${quote.code} enviada para aprovação de alçada (Valor: R$ ${quote.totalAmount.toFixed(2)}).`
    );
    this.notify();
  }

  // Approvals & Workflow
  public approve(requestIdOrQuoteId: string, type: 'request' | 'quote', comment: string): void {
    const user = this.state.currentUser;
    if (user.role !== 'admin' && user.role !== 'approver' && user.role !== 'buyer') {
      throw new Error('Você não possui papel com perfil de aprovação.');
    }

    let targetAmount = 0;
    let quote: Quote | undefined;
    let req: PurchaseRequest | undefined;

    if (type === 'quote') {
      quote = this.state.quotes.find((q) => q.id === requestIdOrQuoteId);
      if (!quote) throw new Error('Cotação não encontrada.');
      targetAmount = quote.totalAmount;
      if (quote.requestId) {
        req = this.state.requests.find((r) => r.id === quote!.requestId);
      }
    } else {
      req = this.state.requests.find((r) => r.id === requestIdOrQuoteId);
      if (!req) throw new Error('Solicitação não encontrada.');
      targetAmount = req.estimatedTotal;
      if (req.quoteId) {
        quote = this.state.quotes.find((q) => q.id === req!.quoteId);
        if (quote && quote.totalAmount > 0) {
          targetAmount = quote.totalAmount;
        }
      }
    }

    // Check Approval Limit
    if (user.approvalLimit < targetAmount) {
      throw new Error(
        `Alçada insuficiente! Seu limite é R$ ${user.approvalLimit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} e o valor a ser aprovado é R$ ${targetAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. É necessária a aprovação de um perfil com alçada superior.`
      );
    }

    const now = new Date().toISOString();
    if (quote) {
      quote.status = 'approved';
      quote.updatedAt = now;
    }

    if (req) {
      req.status = 'approved';
      req.approvedBy = user.userId;
      req.approvedByName = user.displayName;
      req.approvedAt = now;
      req.approvalComment = comment || 'Aprovado conforme alçada corporativa.';
      req.updatedAt = now;
    }

    this.appendAudit(
      'APROVACAO_CONCEDIDA',
      type === 'quote' ? 'Quote' : 'PurchaseRequest',
      requestIdOrQuoteId,
      `Aprovação concedida por ${user.displayName} (Alçada: R$ ${user.approvalLimit.toFixed(2)}) para o montante de R$ ${targetAmount.toFixed(2)}. Parecer: ${comment}`
    );
    this.notify();
  }

  public reject(requestIdOrQuoteId: string, type: 'request' | 'quote', reason: string): void {
    const user = this.state.currentUser;
    if (user.role !== 'admin' && user.role !== 'approver' && user.role !== 'buyer') {
      throw new Error('Você não possui autorização para reprovar solicitações.');
    }

    if (!reason || reason.trim().length < 5) {
      throw new Error('A justificativa da reprovação é obrigatória (mínimo de 5 caracteres).');
    }

    const now = new Date().toISOString();
    if (type === 'quote') {
      const quote = this.state.quotes.find((q) => q.id === requestIdOrQuoteId);
      if (quote) {
        quote.status = 'rejected';
        quote.notes = (quote.notes ? quote.notes + '\n' : '') + `[Reprovado por ${user.displayName}]: ${reason}`;
        quote.updatedAt = now;
      }
      const req = quote ? this.state.requests.find((r) => r.id === quote.requestId) : undefined;
      if (req) {
        req.status = 'rejected';
        req.approvalComment = reason;
        req.updatedAt = now;
      }
    } else {
      const req = this.state.requests.find((r) => r.id === requestIdOrQuoteId);
      if (req) {
        req.status = 'rejected';
        req.approvalComment = reason;
        req.updatedAt = now;
      }
    }

    this.appendAudit(
      'APROVACAO_REJEITADA',
      type === 'quote' ? 'Quote' : 'PurchaseRequest',
      requestIdOrQuoteId,
      `Reprovado por ${user.displayName}. Motivo: ${reason}`
    );
    this.notify();
  }

  // Orders
  public getOrders(): PurchaseOrder[] {
    return [...this.state.orders].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public getOrderById(id: string): PurchaseOrder | undefined {
    return this.state.orders.find((o) => o.id === id);
  }

  public generateOrderFromQuote(quoteId: string): PurchaseOrder {
    const user = this.state.currentUser;
    if (user.role !== 'buyer' && user.role !== 'admin') {
      throw new Error('Apenas compradores e administradores podem gerar pedidos de compra.');
    }

    const quote = this.state.quotes.find((q) => q.id === quoteId);
    if (!quote) throw new Error('Cotação não encontrada.');

    if (quote.status !== 'approved') {
      throw new Error('A cotação precisa estar previamente aprovada para gerar o pedido.');
    }

    const supplier = this.state.suppliers.find((s) => s.id === quote.selectedSupplierId);
    if (!supplier) throw new Error('Fornecedor vencedor não cadastrado.');

    const req = this.state.requests.find((r) => r.id === quote.requestId);
    const bids = quote.bids || [];
    const bid = bids.find((b) => b.supplierId === supplier.id);

    const nextNum = this.state.orders.length + 1;
    const orderNumber = `PED-2026-${String(nextNum).padStart(3, '0')}`;

    const orderItems = (req?.items || []).map((item) => {
      const bidPrice = bid?.itemPrices[item.id]?.unitPrice || item.estimatedUnitPrice;
      return {
        id: 'ord-item-' + item.id,
        description: item.description,
        quantity: item.quantity,
        receivedQuantity: 0,
        unit: item.unit,
        unitPrice: bidPrice,
        totalPrice: bidPrice * item.quantity,
        stockItemId: item.stockItemId,
      };
    });

    const newOrder: PurchaseOrder = {
      id: 'ord-' + Date.now(),
      orderNumber,
      code: orderNumber,
      quoteId: quote.id,
      requestId: req?.id,
      supplierId: supplier.id,
      supplierName: supplier.tradeName || supplier.name || 'Fornecedor',
      supplierCnpj: supplier.cnpj,
      supplierEmail: supplier.email,
      supplierPhone: supplier.phone,
      buyerId: user.userId,
      buyerName: user.displayName,
      approverId: req?.approvedBy,
      approverName: req?.approvedByName,
      status: 'issued',
      totalAmount: quote.totalAmount,
      freightCost: bid?.freightCost || 0,
      freightAmount: bid?.freightCost || 0,
      paymentTerms: bid?.paymentTerms || supplier.paymentTermsDefault || '30 dias',
      deliveryDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      deliveryAddress: 'Av. Paulista, 1000, 12º andar - Almoxarifado Central - São Paulo/SP',
      items: orderItems,
      notes: `Pedido gerado a partir da Cotação ${quote.code} e Solicitação ${req?.code || ''}.`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    quote.status = 'ordered';
    if (req) {
      req.status = 'ordered';
      req.orderId = newOrder.id;
    }

    this.state.orders.unshift(newOrder);
    this.appendAudit(
      'PEDIDO_EMITIDO',
      'PurchaseOrder',
      newOrder.id,
      `Pedido oficial ${orderNumber} emitido para ${supplier.tradeName} no valor de R$ ${newOrder.totalAmount.toFixed(2)}.`
    );
    this.notify();
    return newOrder;
  }

  public updateOrderStatus(orderId: string, status: OrderStatus): void {
    const order = this.state.orders.find((o) => o.id === orderId);
    if (!order) return;
    order.status = status;
    order.updatedAt = new Date().toISOString();
    this.appendAudit('STATUS_PEDIDO_ALTERADO', 'PurchaseOrder', orderId, `Pedido ${order.orderNumber} marcado como ${status}.`);
    this.notify();
  }

  public receiveOrder(
    orderId: string,
    arg2: Record<string, number> | { invoiceNumber: string; invoiceKey?: string; invoiceDate?: string; itemsReceived?: Array<{ itemId: string; quantityReceived: number }>; notes?: string },
    arg3?: { invoiceNumber: string; invoiceKey?: string; invoiceDate?: string }
  ): void {
    const user = this.state.currentUser;
    if (user.role !== 'stock_manager' && user.role !== 'admin') {
      throw new Error('Apenas almoxarifes e administradores podem registrar o recebimento físico e dar entrada em estoque.');
    }

    const order = this.state.orders.find((o) => o.id === orderId);
    if (!order) throw new Error('Pedido não encontrado.');

    let receivedQuantities: Record<string, number> = {};
    let invoiceNumber = '';
    let invoiceKey = '';
    let invoiceDate = new Date().toISOString().split('T')[0];

    if (arg3) {
      receivedQuantities = (arg2 as Record<string, number>) || {};
      invoiceNumber = arg3.invoiceNumber || '';
      invoiceKey = arg3.invoiceKey || '';
      invoiceDate = arg3.invoiceDate || invoiceDate;
    } else if (arg2 && typeof arg2 === 'object') {
      const opts = arg2 as { invoiceNumber: string; invoiceKey?: string; invoiceDate?: string; itemsReceived?: Array<{ itemId: string; quantityReceived: number }> };
      invoiceNumber = opts.invoiceNumber || '';
      invoiceKey = opts.invoiceKey || '';
      invoiceDate = opts.invoiceDate || invoiceDate;
      if (Array.isArray(opts.itemsReceived)) {
        opts.itemsReceived.forEach((it) => {
          receivedQuantities[it.itemId] = it.quantityReceived;
        });
      }
    }

    let allItemsFullyReceived = true;

    order.items.forEach((item) => {
      const incomingQty = receivedQuantities[item.id] || 0;
      if (incomingQty > 0) {
        item.receivedQuantity = (item.receivedQuantity || 0) + incomingQty;

        // Automatically update stock if matched
        if (item.stockItemId) {
          const stockItem = this.state.stock.find((s) => s.id === item.stockItemId);
          if (stockItem) {
            const prevStock = stockItem.currentStock;
            stockItem.currentStock += incomingQty;
            stockItem.lastRestockDate = new Date().toISOString().split('T')[0];
            stockItem.updatedAt = new Date().toISOString();

            // Record immutable stock movement
            const movement: StockMovement = {
              id: 'mov-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
              itemId: stockItem.id,
              stockItemId: stockItem.id,
              itemCode: stockItem.code || stockItem.sku || '',
              description: stockItem.description || stockItem.name || '',
              itemName: stockItem.name || stockItem.description || '',
              type: 'in',
              quantity: incomingQty,
              previousStock: prevStock,
              newStock: stockItem.currentStock,
              referenceType: 'purchase_order',
              referenceId: order.orderNumber || order.code || '',
              invoiceNumber: invoiceNumber,
              userId: user.userId,
              userName: user.displayName,
              performedBy: user.userId,
              performedByName: user.displayName,
              reason: `Recebimento NF ${invoiceNumber}`,
              department: 'Almoxarifado Central',
              notes: `Recebimento de Nota Fiscal ${invoiceNumber} via Pedido ${order.orderNumber || order.code || ''}.`,
              createdAt: new Date().toISOString(),
            };
            this.state.stockMovements.unshift(movement);
          }
        }
      }

      if (item.receivedQuantity < item.quantity) {
        allItemsFullyReceived = false;
      }
    });

    order.invoiceNumber = invoiceNumber;
    order.invoiceKey = invoiceKey;
    order.invoiceDate = invoiceDate;
    order.status = allItemsFullyReceived ? 'received' : 'partially_received';
    order.updatedAt = new Date().toISOString();

    if (allItemsFullyReceived && order.requestId) {
      const req = this.state.requests.find((r) => r.id === order.requestId);
      if (req) {
        req.status = 'completed';
        req.updatedAt = new Date().toISOString();
      }
    }

    this.appendAudit(
      'RECEBIMENTO_FISCAL_REGISTRADO',
      'PurchaseOrder',
      orderId,
      `Recebimento de material registrado pelo almoxarife ${user.displayName} para NF ${invoiceNumber}. Status do pedido: ${order.status}.`
    );
    this.notify();
  }

  // Stock
  public getStock(): StockItem[] {
    return [...this.state.stock];
  }

  public addStockItem(data: {
    code?: string;
    description: string;
    category: string;
    unit: string;
    currentStock: number;
    minStock: number;
    maxStock: number;
    averageCost?: number;
    location: string;
  }): StockItem {
    const user = this.state.currentUser;
    const now = new Date().toISOString();
    const count = this.state.stock.length + 1;
    const code = data.code?.trim() || `MAT-${String(count).padStart(3, '0')}`;
    const desc = data.description.trim();

    const cat = data.category?.trim() || 'Geral';
    if (!this.state.categories.some((c) => c.toLowerCase() === cat.toLowerCase())) {
      this.state.categories.push(cat);
    }

    const newItem: StockItem = {
      id: 'stk-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      code,
      sku: code,
      name: desc,
      description: desc,
      category: cat,
      unit: data.unit.trim().toUpperCase() || 'UN',
      currentStock: Number(data.currentStock) || 0,
      minStock: Number(data.minStock) || 0,
      maxStock: Number(data.maxStock) || Math.max((Number(data.minStock) || 0) * 3, 10),
      averageCost: Number(data.averageCost) || 0,
      avgCost: Number(data.averageCost) || 0,
      location: data.location.trim() || 'Almoxarifado Central',
      lastRestockDate: Number(data.currentStock) > 0 ? now.split('T')[0] : undefined,
      createdAt: now,
      updatedAt: now,
    };

    this.state.stock.unshift(newItem);

    // If initial stock > 0, record initial stock movement
    if (newItem.currentStock > 0) {
      const initMovement: StockMovement = {
        id: 'mov-init-' + Date.now(),
        itemId: newItem.id,
        stockItemId: newItem.id,
        itemCode: newItem.code,
        description: newItem.description,
        itemName: newItem.name,
        type: 'entry',
        quantity: newItem.currentStock,
        previousStock: 0,
        newStock: newItem.currentStock,
        referenceType: 'inventory_count',
        userId: user.userId,
        userName: user.displayName,
        performedBy: user.userId,
        performedByName: user.displayName,
        reason: 'Implantação de saldo inicial de estoque',
        department: 'Almoxarifado Central',
        notes: `Cadastro inicial do material por ${user.displayName}`,
        createdAt: now,
      };
      this.state.stockMovements.unshift(initMovement);
    }

    this.appendAudit(
      'ITEM_ESTOQUE_CADASTRADO',
      'StockItem',
      newItem.id,
      `Novo material "${newItem.description}" (${newItem.code}) cadastrado no almoxarifado por ${user.displayName}. Saldo inicial: ${newItem.currentStock} ${newItem.unit}.`
    );
    this.notify();
    return newItem;
  }

  public updateStockItem(id: string, data: Partial<StockItem>): StockItem {
    const user = this.state.currentUser;
    const item = this.state.stock.find((s) => s.id === id);
    if (!item) throw new Error('Item de estoque não encontrado para atualização.');

    const prevStock = item.currentStock;
    const now = new Date().toISOString();

    if (data.code) {
      item.code = data.code.trim();
      item.sku = item.code;
    }
    if (data.description || data.name) {
      const desc = (data.description || data.name)!.trim();
      item.description = desc;
      item.name = desc;
    }
    if (data.category) {
      const cat = data.category.trim();
      item.category = cat;
      if (!this.state.categories.some((c) => c.toLowerCase() === cat.toLowerCase())) {
        this.state.categories.push(cat);
      }
    }
    if (data.unit) item.unit = data.unit.trim().toUpperCase();
    if (data.location) item.location = data.location.trim();
    if (data.minStock !== undefined) item.minStock = Number(data.minStock);
    if (data.maxStock !== undefined) item.maxStock = Number(data.maxStock);
    if (data.averageCost !== undefined) {
      item.averageCost = Number(data.averageCost);
      item.avgCost = Number(data.averageCost);
    }

    // If currentStock was modified directly in edit modal, register an adjustment movement
    if (data.currentStock !== undefined && Number(data.currentStock) !== prevStock) {
      const newStock = Number(data.currentStock);
      const diff = newStock - prevStock;
      item.currentStock = newStock;

      const adjMovement: StockMovement = {
        id: 'mov-adj-' + Date.now(),
        itemId: item.id,
        stockItemId: item.id,
        itemCode: item.code || item.sku || '',
        description: item.description || item.name || '',
        itemName: item.name || item.description || '',
        type: 'adjustment',
        quantity: Math.abs(diff),
        previousStock: prevStock,
        newStock: newStock,
        referenceType: 'inventory_count',
        userId: user.userId,
        userName: user.displayName,
        performedBy: user.userId,
        performedByName: user.displayName,
        reason: `Ajuste cadastral de saldo (${diff > 0 ? '+' : ''}${diff} ${item.unit})`,
        department: 'Almoxarifado Central',
        notes: `Atualização de dados cadastrais por ${user.displayName}`,
        createdAt: now,
      };
      this.state.stockMovements.unshift(adjMovement);
    }

    item.updatedAt = now;

    this.appendAudit(
      'ITEM_ESTOQUE_ATUALIZADO',
      'StockItem',
      item.id,
      `Material "${item.description}" (${item.code}) atualizado no almoxarifado por ${user.displayName}.`
    );
    this.notify();
    return item;
  }

  public deleteStockItem(id: string): void {
    const user = this.state.currentUser;
    const index = this.state.stock.findIndex((s) => s.id === id);
    if (index === -1) throw new Error('Item de estoque não encontrado para exclusão.');

    const removed = this.state.stock[index];
    this.state.stock.splice(index, 1);

    this.appendAudit(
      'ITEM_ESTOQUE_EXCLUIDO',
      'StockItem',
      id,
      `Material "${removed.description || removed.name}" (${removed.code || removed.sku}) foi excluído do almoxarifado por ${user.displayName}. Saldo na exclusão: ${removed.currentStock} ${removed.unit}.`
    );
    this.notify();
  }

  // Stock Categories Management
  public getCategories(): string[] {
    const list = this.state.categories || [];
    // Ensure all categories in current stock are present
    const fromStock = this.state.stock.map((s) => s.category).filter(Boolean);
    const combined = Array.from(new Set([...list, ...fromStock])).filter(Boolean);
    return combined.sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }

  public addCategory(categoryName: string): string {
    const trimmed = categoryName.trim();
    if (!trimmed) throw new Error('O nome da categoria não pode ser vazio.');
    
    if (!this.state.categories) {
      this.state.categories = [];
    }

    const existing = this.state.categories.find(
      (c) => c.toLowerCase() === trimmed.toLowerCase()
    );
    if (existing) {
      return existing;
    }

    this.state.categories.push(trimmed);
    const user = this.state.currentUser;
    this.appendAudit(
      'CATEGORIA_ESTOQUE_CRIADA',
      'StockCategory',
      trimmed,
      `Nova categoria "${trimmed}" adicionada ao almoxarifado por ${user.displayName}.`
    );
    this.notify();
    return trimmed;
  }

  public updateStockItemCategory(stockItemId: string, newCategory: string): StockItem {
    const user = this.state.currentUser;
    const item = this.state.stock.find((s) => s.id === stockItemId);
    if (!item) throw new Error('Item de estoque não encontrado.');

    const cleanCategory = newCategory.trim() || 'Geral';
    const prevCategory = item.category;

    if (!this.state.categories) {
      this.state.categories = [];
    }
    if (!this.state.categories.some((c) => c.toLowerCase() === cleanCategory.toLowerCase())) {
      this.state.categories.push(cleanCategory);
    }

    item.category = cleanCategory;
    item.updatedAt = new Date().toISOString();

    this.appendAudit(
      'CATEGORIA_ITEM_ATUALIZADA',
      'StockItem',
      item.id,
      `Categoria do item "${item.description || item.name}" alterada de "${prevCategory}" para "${cleanCategory}" por ${user.displayName}.`
    );
    this.notify();
    return item;
  }

  public renameCategory(oldName: string, newName: string): void {
    const user = this.state.currentUser;
    const cleanOld = oldName.trim();
    const cleanNew = newName.trim();
    if (!cleanNew) throw new Error('O novo nome da categoria não pode ser vazio.');
    if (cleanOld.toLowerCase() === cleanNew.toLowerCase()) return;

    if (!this.state.categories) this.state.categories = [];

    // Replace in categories list
    const index = this.state.categories.findIndex((c) => c.toLowerCase() === cleanOld.toLowerCase());
    if (index !== -1) {
      this.state.categories[index] = cleanNew;
    } else {
      this.state.categories.push(cleanNew);
    }

    // Update all stock items with this category
    let count = 0;
    this.state.stock.forEach((item) => {
      if (item.category.toLowerCase() === cleanOld.toLowerCase()) {
        item.category = cleanNew;
        item.updatedAt = new Date().toISOString();
        count++;
      }
    });

    this.appendAudit(
      'CATEGORIA_ESTOQUE_RENOMEADA',
      'StockCategory',
      cleanNew,
      `Categoria "${cleanOld}" renomeada para "${cleanNew}" por ${user.displayName} (${count} materiais atualizados).`
    );
    this.notify();
  }

  public deleteCategory(categoryName: string): void {
    const user = this.state.currentUser;
    const cleanName = categoryName.trim();
    if (!this.state.categories) return;

    this.state.categories = this.state.categories.filter(
      (c) => c.toLowerCase() !== cleanName.toLowerCase()
    );

    // Reassign items with this category to 'Geral'
    let count = 0;
    this.state.stock.forEach((item) => {
      if (item.category.toLowerCase() === cleanName.toLowerCase()) {
        item.category = 'Geral';
        item.updatedAt = new Date().toISOString();
        count++;
      }
    });

    this.appendAudit(
      'CATEGORIA_ESTOQUE_EXCLUIDA',
      'StockCategory',
      cleanName,
      `Categoria "${cleanName}" removida por ${user.displayName} (${count} materiais reclassificados para "Geral").`
    );
    this.notify();
  }

  public getStockMovements(): StockMovement[] {
    return [...this.state.stockMovements].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public createStockRestockRequest(stockItemId: string): PurchaseRequest {
    const user = this.state.currentUser;
    const stockItem = this.state.stock.find((s) => s.id === stockItemId);
    if (!stockItem) throw new Error('Item de estoque não encontrado.');

    const unitCost = stockItem.averageCost ?? stockItem.avgCost ?? 100;
    const qtyToOrder = Math.max(stockItem.maxStock - stockItem.currentStock, stockItem.minStock);
    const estimatedTotal = qtyToOrder * unitCost;

    const req = this.createRequest({
      department: 'Almoxarifado Central',
      justification: `Reposição automática de estoque mínimo para ${stockItem.name || stockItem.description} (SKU: ${stockItem.sku || stockItem.code}). Saldo atual: ${stockItem.currentStock} ${stockItem.unit} (Mínimo: ${stockItem.minStock} ${stockItem.unit}).`,
      urgency: stockItem.currentStock === 0 ? 'urgent' : 'high',
      status: 'pending_quote',
      estimatedTotal,
      items: [
        {
          id: 'item-restock-' + Date.now(),
          description: `${stockItem.name || stockItem.description} (${stockItem.sku || stockItem.code})`,
          quantity: qtyToOrder,
          unit: stockItem.unit,
          estimatedUnitPrice: unitCost,
          stockItemId: stockItem.id,
        },
      ],
    });

    return req;
  }

  public manualStockMovement(
    itemId: string,
    type: 'in' | 'out' | 'adjustment',
    quantity: number,
    department: string,
    notes: string
  ): void {
    const user = this.state.currentUser;
    if (user.role !== 'stock_manager' && user.role !== 'admin') {
      throw new Error('Apenas almoxarifes e administradores podem realizar movimentações de estoque.');
    }

    const item = this.state.stock.find((s) => s.id === itemId);
    if (!item) throw new Error('Item não encontrado.');

    if (type === 'out' && item.currentStock < quantity) {
      throw new Error(`Saldo insuficiente! Estoque atual é de ${item.currentStock} ${item.unit}.`);
    }

    const prevStock = item.currentStock;
    if (type === 'in') {
      item.currentStock += quantity;
    } else if (type === 'out') {
      item.currentStock -= quantity;
    } else {
      item.currentStock = quantity;
    }

    item.updatedAt = new Date().toISOString();

    const movement: StockMovement = {
      id: 'mov-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      itemId: item.id,
      stockItemId: item.id,
      itemCode: item.code || item.sku || '',
      description: item.description || item.name || '',
      itemName: item.name || item.description || '',
      type,
      quantity,
      previousStock: prevStock,
      newStock: item.currentStock,
      referenceType: type === 'out' ? 'requisition' : 'inventory_count',
      userId: user.userId,
      userName: user.displayName,
      performedBy: user.userId,
      performedByName: user.displayName,
      reason: type === 'out' ? 'Saída requisitada' : type === 'in' ? 'Entrada avulsa' : 'Ajuste de inventário',
      department: department || 'Geral',
      notes,
      createdAt: new Date().toISOString(),
    };

    this.state.stockMovements.unshift(movement);
    this.appendAudit(
      'MOVIMENTACAO_ESTOQUE',
      'StockItem',
      itemId,
      `Movimentação (${type.toUpperCase()}) de ${quantity} ${item.unit} em ${item.name} realizada por ${user.displayName}.`
    );
    this.notify();
  }

  // Suppliers
  public getSuppliers(): Supplier[] {
    return [...this.state.suppliers];
  }

  public addSupplier(data: Omit<Supplier, 'id' | 'createdAt'>): Supplier {
    const tradeName = data.tradeName || data.name || 'Fornecedor';
    const newSup: Supplier = {
      ...data,
      name: tradeName,
      tradeName,
      contactName: data.contactName || data.contactPerson || 'Comercial',
      id: 'sup-' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    this.state.suppliers.push(newSup);
    this.appendAudit('FORNECEDOR_CADASTRADO', 'Supplier', newSup.id, `Novo fornecedor ${newSup.tradeName} (CNPJ: ${newSup.cnpj}) cadastrado.`);
    this.notify();
    return newSup;
  }

  public createSupplier(data: any): Supplier {
    return this.addSupplier(data);
  }

  // Stock helpers
  public createStockMovement(data: {
    stockItemId: string;
    itemCode: string;
    description: string;
    type: 'entry' | 'exit' | 'adjustment' | 'in' | 'out';
    quantity: number;
    reason: string;
  }): void {
    const dir: 'in' | 'out' | 'adjustment' =
      data.type === 'entry' || data.type === 'in'
        ? 'in'
        : data.type === 'exit' || data.type === 'out'
        ? 'out'
        : 'adjustment';
    this.manualStockMovement(data.stockItemId, dir, data.quantity, 'Almoxarifado Central', data.reason);
  }

  public autoReorderLowStock(): PurchaseRequest | null {
    const lowStockItems = this.state.stock.filter((s) => s.currentStock <= s.minStock);
    if (lowStockItems.length === 0) return null;

    const items = lowStockItems.map((stk) => {
      const neededQty = Math.max(stk.maxStock - stk.currentStock, stk.minStock);
      const unitCost = stk.averageCost || stk.avgCost || 100;
      return {
        id: 'item-auto-' + stk.id + '-' + Date.now(),
        description: `${stk.description || stk.name || ''} (${stk.code || stk.sku || ''})`,
        quantity: neededQty,
        unit: stk.unit,
        estimatedUnitPrice: unitCost,
        stockItemId: stk.id,
        notes: `Estoque atual: ${stk.currentStock} / Mínimo: ${stk.minStock}`,
      };
    });

    const totalEst = items.reduce((sum, it) => sum + it.quantity * it.estimatedUnitPrice, 0);

    return this.createRequest({
      department: 'Almoxarifado Central',
      justification: `Reposição automática de estoque mínimo para ${items.length} itens em ponto crítico de abastecimento.`,
      urgency: 'high',
      status: 'pending_quote',
      estimatedTotal: totalEst,
      items,
    });
  }

  // User management
  public updateUser(userId: string, data: Partial<User>): void {
    const userIndex = this.state.users.findIndex((u) => u.userId === userId);
    if (userIndex === -1) return;

    this.state.users[userIndex] = {
      ...this.state.users[userIndex],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    if (this.state.currentUser.userId === userId) {
      this.state.currentUser = this.state.users[userIndex];
    }

    this.appendAudit(
      'USUARIO_ATUALIZADO',
      'User',
      userId,
      `Usuário ${this.state.users[userIndex].displayName} atualizado: cargo ${this.state.users[userIndex].role}, status ${this.state.users[userIndex].status}.`
    );
    this.notify();
  }

  // Quote workflows
  public updateQuoteWinner(quoteId: string, supplierId: string): void {
    const quote = this.state.quotes.find((q) => q.id === quoteId);
    if (!quote) return;
    const sup = this.state.suppliers.find((s) => s.id === supplierId);
    quote.selectedSupplierId = supplierId;
    quote.winnerSupplierId = supplierId;
    const prop = (quote.proposals || []).find((p) => p.supplierId === supplierId);
    quote.winnerSupplierName = prop?.supplierName || (sup ? (sup.tradeName || sup.corporateName) : undefined);
    if (prop && prop.totalAmount > 0) {
      quote.totalAmount = prop.totalAmount;
    }
    quote.updatedAt = new Date().toISOString();
    this.saveQuote(quote);
  }

  public updateQuoteProposals(quoteId: string, proposals: any[]): void {
    const quote = this.state.quotes.find((q) => q.id === quoteId);
    if (!quote) return;
    quote.proposals = proposals;

    // Recalculate totals and savings
    const totals = proposals.map((p) => p.totalAmount).filter((t) => t > 0);
    const lowestTotal = totals.length > 0 ? Math.min(...totals) : 0;
    const highestTotal = totals.length > 0 ? Math.max(...totals) : 0;
    const savingAmount = highestTotal > lowestTotal ? highestTotal - lowestTotal : 0;
    const savingPercent = highestTotal > 0 ? Number(((savingAmount / highestTotal) * 100).toFixed(1)) : 0;

    quote.savingAmount = savingAmount;
    quote.savingPercent = savingPercent;

    const winnerProp = proposals.find((p) => p.supplierId === (quote.winnerSupplierId || quote.selectedSupplierId));
    if (winnerProp && winnerProp.totalAmount > 0) {
      quote.totalAmount = winnerProp.totalAmount;
    } else if (lowestTotal > 0) {
      quote.totalAmount = lowestTotal;
    }

    quote.updatedAt = new Date().toISOString();
    this.saveQuote(quote);
  }

  public addQuoteItem(quoteId: string, item: RequestItem): void {
    const quote = this.state.quotes.find((q) => q.id === quoteId);
    if (!quote) return;
    if (!quote.items) quote.items = [];
    quote.items.push(item);

    if (Array.isArray(quote.proposals)) {
      quote.proposals.forEach((p) => {
        if (!p.items) p.items = [];
        const exists = p.items.find((pi) => pi.itemId === item.id);
        if (!exists) {
          p.items.push({
            itemId: item.id,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: 0,
            totalPrice: 0,
          });
        }
      });
    }
    quote.updatedAt = new Date().toISOString();
    this.saveQuote(quote);
  }

  public approveQuote(quoteId: string, comment?: string): PurchaseOrder {
    this.approve(quoteId, 'quote', comment || 'Cotação aprovada conforme mapa comparativo.');
    return this.generateOrderFromQuote(quoteId);
  }

  public rejectQuote(quoteId: string, reason: string): void {
    this.reject(quoteId, 'quote', reason);
  }

  public createQuoteFromRequest(requestId: string): Quote {
    return this.createQuoteForRequest(requestId);
  }

  public submitQuoteToApproval(quoteId: string): void {
    this.sendQuoteForApproval(quoteId);
  }

  // Approval Rules
  public getApprovalRules(): ApprovalRule[] {
    return [...this.state.approvalRules];
  }

  // Reset database for test / demo
  public resetToInitial(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.state = this.loadState();
    this.notify();
  }
}

export const dbService = new DataService();
