<?php

/**
 * SCF STEEL TRADING
 * PRODUCTS API
 *
 * GET
 * /api/products.php
 *
 * GET
 * /api/products.php?grouped=1
 *
 * GET
 * /api/products.php?id=12
 *
 * POST
 * /api/products.php
 *
 * POST
 * /api/products.php?action=update-variant
 *
 * POST
 * /api/products.php?action=deactivate-group
 *
 * DELETE
 * /api/products.php?id=12
 */


declare(strict_types=1);


ini_set(
    'display_errors',
    '0'
);

error_reporting(
    E_ALL
);


header(
    'Content-Type: application/json; charset=utf-8'
);

header(
    'Access-Control-Allow-Origin: *'
);

header(
    'Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS'
);

header(
    'Access-Control-Allow-Headers: Content-Type'
);


if (
    $_SERVER['REQUEST_METHOD'] ===
    'OPTIONS'
) {

    http_response_code(204);

    exit;

}


require __DIR__ . '/db.php';


/* =========================
   CATALOG LABEL
========================= */

function catalog_label(
    string $catalog
): string {

    return
        $catalog ===
        'Hardware Items'

        ? 'Hardware Materials'

        : $catalog;

}


/* =========================
   SPECIFICATION
========================= */

function spec_of(
    array $row
): string {

    $parts =
        array_filter(
            [

                $row['dimensions']
                    ?? null,

                $row['size']
                    ?? null,

                $row['thickness']
                    ?? null,

                $row['gauge']
                    ?? null,

                $row['kilos']
                    ?? null,

                $row['grade']
                    ?? null,

                $row['color']
                    ?? null,

                $row['variant']
                    ?? null,

                $row['brand']
                    ?? null,

            ],

            static fn($value) =>
                $value !== null &&
                $value !== ''
        );


    return implode(
        ' · ',
        array_unique(
            $parts
        )
    );

}


/* =========================
   CATALOG VISIBILITY
========================= */

/*
 * We store this in notes because
 * the current database does not
 * appear to have a separate
 * show_in_catalog column.
 *
 * Existing old records remain
 * visible by default.
 */

function show_in_catalog(
    ?string $notes
): int {

    if (
        $notes !== null &&
        str_contains(
            $notes,
            'show_in_catalog:0'
        )
    ) {

        return 0;

    }


    return 1;

}


/* =========================
   CHECK IF ROW IS A VARIANT
========================= */

function is_variant_row(
    array $row
): bool {

    if (
        spec_of($row) !== ''
    ) {

        return true;

    }


    if (
        $row['price'] !== null &&
        $row['price'] !== ''
    ) {

        return true;

    }


    if (
        $row['price_unit'] !== null &&
        $row['price_unit'] !== ''
    ) {

        return true;

    }


    return false;

}


/* =========================
   MAP DATABASE ROW
========================= */

function map_row(
    array $row
): array {

    $id =
        (int) $row['id'];


    return [

        'id' =>
            $id,

        /*
         * Actual product/row ID.
         * No longer uses
         * categories.product_id.
         */
        'product_id' =>
            $id,

        'product_code' =>
            'P-' .
            str_pad(
                (string) $id,
                4,
                '0',
                STR_PAD_LEFT
            ),

        'category_id' =>
            (int)
            $row['category_id'],

        'category' =>
            $row['category_name']
            ?? '',

        'catalog' =>
            $row['catalog']
            ?? '',

        'catalog_label' =>
            catalog_label(
                (string)
                (
                    $row['catalog']
                    ?? ''
                )
            ),

        'name' =>
            $row['name'],

        'spec' =>
            spec_of($row),

        'dimensions' =>
            $row['dimensions'],

        'size' =>
            $row['size'],

        'thickness' =>
            $row['thickness'],

        'color' =>
            $row['color'],

        'price' =>
            $row['price'] !== null

            ? (float)
              $row['price']

            : null,

        'price_unit' =>
            $row['price_unit'],

        'price_half' =>
            $row['price_half'] !== null

            ? (float)
              $row['price_half']

            : null,

        'price_quarter' =>
            $row['price_quarter'] !== null

            ? (float)
              $row['price_quarter']

            : null,

        'gauge' =>
            $row['gauge'],

        'kilos' =>
            $row['kilos'],

        'grade' =>
            $row['grade'],

        'variant' =>
            $row['variant'],

        'brand' =>
            $row['brand'],

        'notes' =>
            $row['notes'],

        'price_per_ft' =>
            $row['price_per_ft'] !== null

            ? (float)
              $row['price_per_ft']

            : null,

        'description' =>
            $row['description'],

        'image' =>
            $row['image_path'],

        'show_in_catalog' =>
            show_in_catalog(
                $row['notes']
                ?? null
            ),

        'is_active' =>
            (int)
            $row['is_active'],

    ];

}


/* =========================
   BASE SELECT
========================= */

$select = "

    SELECT

        p.*,

        c.name
            AS category_name

    FROM products p

    LEFT JOIN categories c
        ON c.id = p.category_id

";


$method =
    $_SERVER['REQUEST_METHOD'];


/* =========================
   GET
========================= */

if (
    $method ===
    'GET'
) {

    /* =========================
       GET ONE PRODUCT
    ========================= */

    if (
        !empty(
            $_GET['id']
        )
    ) {

        $id =
            (int)
            $_GET['id'];


        $statement =
            $pdo->prepare(

                $select .

                '
                WHERE
                    p.id = ?
                    AND p.is_active = 1

                LIMIT 1
                '

            );


        $statement->execute([
            $id
        ]);


        $row =
            $statement->fetch();


        if (!$row) {

            http_response_code(
                404
            );


            echo json_encode([

                'ok' =>
                    false,

                'error' =>
                    'Product not found.'

            ]);


            exit;

        }


        /*
         * IMPORTANT FIX:
         *
         * Old code fetched every row
         * having the same category.
         *
         * Now variants must have:
         *
         * same category
         * +
         * same product name
         */

        $siblings =
            $pdo->prepare(

                $select .

                '
                WHERE
                    p.category_id = ?
                    AND p.name = ?
                    AND p.is_active = 1

                ORDER BY
                    p.id
                '

            );


        $siblings->execute([

            $row['category_id'],

            $row['name']

        ]);


        $siblingRows =
            $siblings->fetchAll();


        $variants = [];


        foreach (
            $siblingRows
            as $sibling
        ) {

            if (
                is_variant_row(
                    $sibling
                )
            ) {

                $variants[] =
                    map_row(
                        $sibling
                    );

            }

        }


        echo json_encode([

            'ok' =>
                true,

            'product' =>
                map_row(
                    $row
                ),

            'variants' =>
                $variants

        ]);


        exit;

    }


    /* =========================
       GET PRODUCTS
    ========================= */

    $rows =
        $pdo->query(

            $select .

            '
            WHERE
                p.is_active = 1

            ORDER BY
                p.id
            '

        )
        ->fetchAll();


    $products =
        array_map(
            'map_row',
            $rows
        );


    /* =========================
       CATEGORIES
    ========================= */

    $categories =
        $pdo->query(

            '
            SELECT
                id,
                name,
                parent_id,
                sort_order

            FROM categories

            ORDER BY
                sort_order,
                name
            '

        )
        ->fetchAll();


    /* =========================
       GROUPED PRODUCTS
    ========================= */

    if (
        !empty(
            $_GET['grouped']
        )
    ) {

        $groups = [];


        foreach (
            $rows
            as $rawRow
        ) {

            $product =
                map_row(
                    $rawRow
                );


            /*
             * IMPORTANT FIX:
             *
             * Do NOT group by
             * category only.
             *
             * Square Tube and
             * Angle Bar can both
             * belong to Steel
             * Products.
             */

            $key =
                (string)
                $product['category_id']
                .
                '|'
                .
                mb_strtolower(
                    trim(
                        $product['name']
                    )
                );


            $rowIsVariant =
                is_variant_row(
                    $rawRow
                );


            if (
                !isset(
                    $groups[$key]
                )
            ) {

                $groups[$key] = [

                    'id' =>
                        $product['id'],

                    'product_id' =>
                        $product['id'],

                    'product_code' =>
                        $product[
                            'product_code'
                        ],

                    'category_id' =>
                        $product[
                            'category_id'
                        ],

                    /*
                     * IMPORTANT:
                     * Product name stays
                     * Product Name.
                     */
                    'name' =>
                        $product['name'],

                    'catalog' =>
                        $product['catalog'],

                    'catalog_label' =>
                        $product[
                            'catalog_label'
                        ],

                    'category' =>
                        $product[
                            'category'
                        ],

                    'image' =>
                        $product['image'],

                    'description' =>
                        $product[
                            'description'
                        ],

                    'show_in_catalog' =>
                        $product[
                            'show_in_catalog'
                        ],

                    'price' =>
                        $product['price'],

                    'price_unit' =>
                        $product[
                            'price_unit'
                        ],

                    'variant_count' =>
                        0,

                    'variants' =>
                        [],

                    /*
                     * Helps us prefer
                     * the base product
                     * row if one exists.
                     */
                    '_has_base' =>
                        !$rowIsVariant

                ];

            }


            /*
             * Newly created product row
             * has no specification.
             *
             * Use it as representative
             * product information.
             */

            if (
                !$rowIsVariant &&
                !$groups[$key][
                    '_has_base'
                ]
            ) {

                $groups[$key]['id'] =
                    $product['id'];


                $groups[$key]['product_id'] =
                    $product['id'];


                $groups[$key]['product_code'] =
                    $product[
                        'product_code'
                    ];


                $groups[$key]['image'] =
                    $product['image'];


                $groups[$key]['description'] =
                    $product[
                        'description'
                    ];


                $groups[$key]['show_in_catalog'] =
                    $product[
                        'show_in_catalog'
                    ];


                $groups[$key]['_has_base'] =
                    true;

            }


            /*
             * Only actual variant rows
             * belong in variants[].
             */

            if ($rowIsVariant) {

                $groups[$key][
                    'variant_count'
                ]++;


                $groups[$key][
                    'variants'
                ][] =
                    $product;


                if (
                    $product['price'] !==
                    null
                    &&
                    (
                        $groups[$key][
                            'price'
                        ] === null
                        ||
                        $product['price'] <
                        $groups[$key][
                            'price'
                        ]
                    )
                ) {

                    $groups[$key]['price'] =
                        $product['price'];


                    $groups[$key]['price_unit'] =
                        $product[
                            'price_unit'
                        ];

                }

            }


            if (
                !$groups[$key]['image']
                &&
                $product['image']
            ) {

                $groups[$key]['image'] =
                    $product['image'];

            }


            if (
                !$groups[$key][
                    'description'
                ]
                &&
                $product['description']
            ) {

                $groups[$key]['description'] =
                    $product[
                        'description'
                    ];

            }

        }


        $groupedProducts =
            array_values(
                $groups
            );


        foreach (
            $groupedProducts
            as &$group
        ) {

            unset(
                $group['_has_base']
            );

        }


        unset($group);


        echo json_encode([

            'ok' =>
                true,

            'source' =>
                'database',

            'categories' =>
                $categories,

            'products' =>
                $groupedProducts

        ]);


        exit;

    }


    echo json_encode([

        'ok' =>
            true,

        'source' =>
            'database',

        'categories' =>
            $categories,

        'products' =>
            $products

    ]);


    exit;

}


/* =========================
   POST ACTIONS
========================= */

if (
    $method === 'POST'
    &&
    isset(
        $_GET['action']
    )
) {

    $input =
        json_decode(
            file_get_contents(
                'php://input'
            ),
            true
        );


    if (
        !is_array(
            $input
        )
    ) {

        http_response_code(
            422
        );


        echo json_encode([

            'ok' =>
                false,

            'error' =>
                'Invalid request.'

        ]);


        exit;

    }


    try {

        $id =
            filter_var(
                $input['id']
                ?? null,
                FILTER_VALIDATE_INT
            );


        if (
            !$id ||
            $id < 1
        ) {

            throw new InvalidArgumentException(
                'A valid record ID is required.'
            );

        }


        /* =========================
           UPDATE VARIANT
        ========================= */

        if (
            $_GET['action'] ===
            'update-variant'
        ) {

            /*
             * This is intentionally
             * kept from the existing
             * variant system.
             */

            $limits = [

                'dimensions' => 80,

                'size' => 80,

                'thickness' => 30,

                'kilos' => 30,

                'gauge' => 20,

                'color' => 30,

                'grade' => 20,

                'variant' => 60,

                'brand' => 60,

                'price_unit' => 20

            ];


            $prices = [

                'price',

                'price_half',

                'price_quarter',

                'price_per_ft'

            ];


            $changes = [];

            $values = [];


            foreach (
                array_merge(
                    array_keys(
                        $limits
                    ),
                    $prices
                )
                as $field
            ) {

                if (
                    !array_key_exists(
                        $field,
                        $input
                    )
                ) {

                    continue;

                }


                if (
                    $input[$field] !==
                    null
                    &&
                    !is_scalar(
                        $input[$field]
                    )
                ) {

                    throw new InvalidArgumentException(
                        'Invalid field value.'
                    );

                }


                $value =
                    trim(
                        (string)
                        (
                            $input[$field]
                            ?? ''
                        )
                    );


                if (
                    in_array(
                        $field,
                        $prices,
                        true
                    )
                ) {

                    if (
                        $value !== ''
                        &&
                        !preg_match(
                            '/^\d{1,8}(\.\d{1,2})?$/D',
                            $value
                        )
                    ) {

                        throw new InvalidArgumentException(
                            'Prices must be nonnegative with at most two decimal places.'
                        );

                    }

                } else {

                    if (
                        preg_match_all(
                            '/./us',
                            $value
                        )
                        >
                        $limits[$field]
                    ) {

                        throw new InvalidArgumentException(
                            $field .
                            ' is too long.'
                        );

                    }

                }


                $changes[] =
                    '`' .
                    $field .
                    '` = ?';


                $values[] =
                    $value === ''

                    ? null

                    : $value;

            }


            if (!$changes) {

                throw new InvalidArgumentException(
                    'No changes supplied.'
                );

            }


            $pdo->beginTransaction();


            $check =
                $pdo->prepare(

                    '
                    SELECT id

                    FROM products

                    WHERE
                        id = ?
                        AND is_active = 1

                    FOR UPDATE
                    '

                );


            $check->execute([
                $id
            ]);


            if (
                !$check->fetch()
            ) {

                throw new InvalidArgumentException(
                    'This record is no longer active. Refresh the page.'
                );

            }


            $values[] =
                $id;


            $update =
                $pdo->prepare(

                    'UPDATE products SET '
                    .
                    implode(
                        ', ',
                        $changes
                    )
                    .
                    ' WHERE id = ?'

                );


            $update->execute(
                $values
            );


            $pdo->commit();


            echo json_encode([
                'ok' => true
            ]);


            exit;

        }


        /* =========================
           DEACTIVATE PRODUCT GROUP
        ========================= */

        if (
            $_GET['action'] ===
            'deactivate-group'
        ) {

            $pdo->beginTransaction();


            $lookup =
                $pdo->prepare(

                    '
                    SELECT
                        category_id,
                        name

                    FROM products

                    WHERE
                        id = ?
                        AND is_active = 1

                    FOR UPDATE
                    '

                );


            $lookup->execute([
                $id
            ]);


            $group =
                $lookup->fetch();


            if (!$group) {

                throw new InvalidArgumentException(
                    'This product is no longer active. Refresh the page.'
                );

            }


            /*
             * IMPORTANT FIX:
             *
             * Only delete:
             * same category
             * +
             * same product name
             *
             * NOT the entire category.
             */

            $delete =
                $pdo->prepare(

                    '
                    UPDATE products

                    SET
                        is_active = 0

                    WHERE
                        category_id = ?
                        AND name = ?
                        AND is_active = 1
                    '

                );


            $delete->execute([

                $group['category_id'],

                $group['name']

            ]);


            $count =
                $delete->rowCount();


            $pdo->commit();


            echo json_encode([

                'ok' =>
                    true,

                'affected' =>
                    $count

            ]);


            exit;

        }


        throw new InvalidArgumentException(
            'Unknown action.'
        );


    } catch (
        Throwable $error
    ) {

        if (
            $pdo->inTransaction()
        ) {

            $pdo->rollBack();

        }


        $validation =
            $error instanceof
            InvalidArgumentException;


        http_response_code(
            $validation
            ? 422
            : 500
        );


        if (!$validation) {

            error_log(
                (string)
                $error
            );

        }


        echo json_encode([

            'ok' =>
                false,

            'error' =>
                $validation

                ? $error->getMessage()

                : 'Could not save the change.'

        ]);


        exit;

    }

}


/* =========================
   ADD PRODUCT
========================= */

if (
    $method ===
    'POST'
) {

    $name =
        trim(
            (string)
            (
                $_POST['name']
                ?? ''
            )
        );


    $categoryId =
        (int)
        (
            $_POST[
                'category_id'
            ]
            ?? 0
        );


    $description =
        trim(
            (string)
            (
                $_POST[
                    'description'
                ]
                ?? ''
            )
        );


    $showInCatalog =
        (
            isset(
                $_POST[
                    'showInCatalog'
                ]
            )
            &&
            $_POST[
                'showInCatalog'
            ] === '1'
        )

        ? 1

        : 0;


    /*
     * VARIANTS ARE OPTIONAL.
     *
     * This keeps compatibility
     * with older forms/API calls
     * that may still send variants.
     */

    $variantsRaw =
        $_POST['variants']
        ?? null;


    $variants =
        null;


    if (
        $variantsRaw !==
        null
    ) {

        $variants =
            json_decode(
                (string)
                $variantsRaw,
                true
            );


        if (
            !is_array(
                $variants
            )
        ) {

            http_response_code(
                422
            );


            echo json_encode([

                'ok' =>
                    false,

                'error' =>
                    'Invalid variant data.'

            ]);


            exit;

        }

    }


    /* =========================
       VALIDATION
    ========================= */

    if (
        $name === ''
    ) {

        http_response_code(
            422
        );


        echo json_encode([

            'ok' =>
                false,

            'error' =>
                'Product name is required.'

        ]);


        exit;

    }


    if (
        $categoryId <= 0
    ) {

        http_response_code(
            422
        );


        echo json_encode([

            'ok' =>
                false,

            'error' =>
                'Please select a category.'

        ]);


        exit;

    }


    /* =========================
       CATEGORY
    ========================= */

    $category =
        $pdo->prepare(

            '
            SELECT

                c.id,

                c.name,

                c.parent_id,

                p.name
                    AS parent_name

            FROM categories c

            LEFT JOIN categories p
                ON p.id =
                c.parent_id

            WHERE
                c.id = ?

            LIMIT 1
            '

        );


    $category->execute([
        $categoryId
    ]);


    $categoryRow =
        $category->fetch();


    if (!$categoryRow) {

        http_response_code(
            422
        );


        echo json_encode([

            'ok' =>
                false,

            'error' =>
                'Selected category does not exist.'

        ]);


        exit;

    }


    $catalog =
        $categoryRow[
            'parent_name'
        ]
        ?:
        $categoryRow[
            'name'
        ];


    /* =========================
       DUPLICATE PRODUCT CHECK
    ========================= */

    $duplicate =
        $pdo->prepare(

            '
            SELECT id

            FROM products

            WHERE
                category_id = ?
                AND LOWER(TRIM(name)) =
                    LOWER(TRIM(?))
                AND is_active = 1

            LIMIT 1
            '

        );


    $duplicate->execute([

        $categoryId,

        $name

    ]);


    /*
     * If a product already exists,
     * don't create another empty
     * base row through Add Product.
     */

    if (
        $duplicate->fetch()
        &&
        (
            $variants === null
            ||
            count($variants) === 0
        )
    ) {

        http_response_code(
            422
        );


        echo json_encode([

            'ok' =>
                false,

            'error' =>
                'This product already exists in the selected category.'

        ]);


        exit;

    }


    /* =========================
       IMAGE UPLOAD
    ========================= */

    $imagePath =
        null;


    if (
        !empty(
            $_FILES['image']['name']
        )
    ) {

        if (
            (int)
            $_FILES['image']['error']
            !==
            UPLOAD_ERR_OK
        ) {

            http_response_code(
                422
            );


            echo json_encode([

                'ok' =>
                    false,

                'error' =>
                    'Could not upload the product image.'

            ]);


            exit;

        }


        $allowed = [

            'image/png' =>
                'png',

            'image/jpeg' =>
                'jpg',

            'image/webp' =>
                'webp'

        ];


        $mime =
            mime_content_type(
                $_FILES[
                    'image'
                ][
                    'tmp_name'
                ]
            )
            ?: '';


        if (
            !isset(
                $allowed[$mime]
            )
        ) {

            http_response_code(
                422
            );


            echo json_encode([

                'ok' =>
                    false,

                'error' =>
                    'Image must be PNG, JPG, or WebP.'

            ]);


            exit;

        }


        if (
            (int)
            $_FILES['image']['size']
            >
            2 * 1024 * 1024
        ) {

            http_response_code(
                422
            );


            echo json_encode([

                'ok' =>
                    false,

                'error' =>
                    'Image must be 2 MB or smaller.'

            ]);


            exit;

        }


        $folder =
            dirname(
                __DIR__
            )
            .
            '/uploads/products';


        if (
            !is_dir(
                $folder
            )
        ) {

            mkdir(
                $folder,
                0775,
                true
            );

        }


        $filename =
            'product-'
            .
            date(
                'Ymd-His'
            )
            .
            '-'
            .
            bin2hex(
                random_bytes(
                    3
                )
            )
            .
            '.'
            .
            $allowed[$mime];


        $destination =
            $folder
            .
            '/'
            .
            $filename;


        if (
            !move_uploaded_file(
                $_FILES[
                    'image'
                ][
                    'tmp_name'
                ],
                $destination
            )
        ) {

            http_response_code(
                500
            );


            echo json_encode([

                'ok' =>
                    false,

                'error' =>
                    'Could not save the product image.'

            ]);


            exit;

        }


        $imagePath =
            'uploads/products/'
            .
            $filename;

    }


    /* =========================
       INSERT
    ========================= */

    $insert =
        $pdo->prepare(

            '
            INSERT INTO products
            (
                category_id,
                catalog,
                name,
                dimensions,
                size,
                price,
                price_unit,
                variant,
                description,
                notes,
                image_path,
                is_active
            )

            VALUES
            (
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                1
            )
            '

        );


    $pdo->beginTransaction();


    $created = [];


    try {

        /*
         * =========================
         * OLD VARIANT MODE
         * =========================
         *
         * If another existing part
         * of the system still sends
         * variants, keep supporting
         * them.
         */

        if (
            is_array(
                $variants
            )
            &&
            count(
                $variants
            ) > 0
        ) {

            foreach (
                $variants
                as $variant
            ) {

                $spec =
                    trim(
                        (string)
                        (
                            $variant[
                                'spec'
                            ]
                            ?? ''
                        )
                    );


                $unit =
                    trim(
                        (string)
                        (
                            $variant[
                                'unit'
                            ]
                            ?? 'pc'
                        )
                    )
                    ?: 'pc';


                $price =
                    $variant[
                        'price'
                    ]
                    ?? null;


                $sku =
                    trim(
                        (string)
                        (
                            $variant[
                                'sku'
                            ]
                            ?? ''
                        )
                    );


                $minStock =
                    (int)
                    (
                        $variant[
                            'min_stock'
                        ]
                        ?? 0
                    );


                if (
                    $spec === ''
                    ||
                    $price === null
                    ||
                    $price === ''
                    ||
                    !is_numeric(
                        $price
                    )
                ) {

                    throw new RuntimeException(
                        'Each variant needs a specification and a price.'
                    );

                }


                $notes = [];


                if (
                    $minStock > 0
                ) {

                    $notes[] =
                        'min_stock:'
                        .
                        $minStock;

                }


                $notes[] =
                    'show_in_catalog:'
                    .
                    $showInCatalog;


                $insert->execute([

                    $categoryId,

                    $catalog,

                    $name,

                    $spec,

                    $spec,

                    number_format(
                        (float)
                        $price,
                        2,
                        '.',
                        ''
                    ),

                    $unit,

                    $sku !== ''
                    ? $sku
                    : null,

                    $description !== ''
                    ? $description
                    : null,

                    implode(
                        ';',
                        $notes
                    ),

                    $imagePath

                ]);


                $created[] =
                    (int)
                    $pdo->lastInsertId();

            }

        } else {

            /*
             * =========================
             * NEW ADD PRODUCT MODE
             * =========================
             *
             * Create ONE base product
             * row with no variant yet.
             */

            $notes =
                'show_in_catalog:'
                .
                $showInCatalog;


            $insert->execute([

                $categoryId,

                $catalog,

                $name,

                null,

                null,

                null,

                null,

                null,

                $description !== ''
                ? $description
                : null,

                $notes,

                $imagePath

            ]);


            $created[] =
                (int)
                $pdo->lastInsertId();

        }


        $pdo->commit();


    } catch (
        Throwable $error
    ) {

        if (
            $pdo->inTransaction()
        ) {

            $pdo->rollBack();

        }


        if (
            $imagePath &&
            isset(
                $destination
            )
            &&
            is_file(
                $destination
            )
        ) {

            @unlink(
                $destination
            );

        }


        http_response_code(
            422
        );


        echo json_encode([

            'ok' =>
                false,

            'error' =>
                $error->getMessage()

        ]);


        exit;

    }


    $mainId =
        $created[0];


    echo json_encode([

        'ok' =>
            true,

        'id' =>
            $mainId,

        'product_id' =>
            $mainId,

        'product_code' =>
            'P-'
            .
            str_pad(
                (string)
                $mainId,
                4,
                '0',
                STR_PAD_LEFT
            ),

        'ids' =>
            $created,

        'message' =>
            count($created) > 1

            ? count($created)
              .
              ' variants saved.'

            : 'Product added successfully.'

    ]);


    exit;

}


/* =========================
   DELETE ONE RECORD
========================= */

if (
    $method ===
    'DELETE'
) {

    $id =
        (int)
        (
            $_GET['id']
            ?? 0
        );


    if (
        $id <= 0
    ) {

        http_response_code(
            422
        );


        echo json_encode([

            'ok' =>
                false,

            'error' =>
                'Missing product ID.'

        ]);


        exit;

    }


    $statement =
        $pdo->prepare(

            '
            UPDATE products

            SET
                is_active = 0

            WHERE
                id = ?
            '

        );


    $statement->execute([
        $id
    ]);


    echo json_encode([

        'ok' =>
            true

    ]);


    exit;

}


/* =========================
   METHOD NOT ALLOWED
========================= */

http_response_code(
    405
);


echo json_encode([

    'ok' =>
        false,

    'error' =>
        'Method not allowed.'

]);