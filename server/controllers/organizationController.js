import Organization from '../models/Organization.js';

/**
 * @desc    Get Organization profile (or create default if not exists)
 * @route   GET /api/organization
 * @access  Private (All authenticated users)
 */
export const getOrganizationProfile = async (req, res) => {
  try {
    let org = await Organization.findOne();

    if (!org) {
      org = await Organization.create({
        name: 'EcoTrack City Municipality',
        orgType: 'Municipality',
        address: '100 Green Planet Way, Eco City, EC 90210',
        contactEmail: 'contact@ecotrack.org',
        contactPhone: '+1 (555) 019-2831',
        website: 'https://ecotrack.org'
      });
    }

    res.status(200).json({
      status: 'success',
      organization: org
    });
  } catch (error) {
    console.error('[Get Org Error]', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to fetch organization profile'
    });
  }
};

/**
 * @desc    Update Organization profile
 * @route   PUT /api/organization
 * @access  Private (Organization Admin only)
 */
export const updateOrganizationProfile = async (req, res) => {
  try {
    const { name, orgType, address, contactEmail, contactPhone, website } = req.body;

    let org = await Organization.findOne();

    if (!org) {
      org = new Organization({});
    }

    if (name) org.name = name;
    if (orgType) org.orgType = orgType;
    if (address !== undefined) org.address = address;
    if (contactEmail !== undefined) org.contactEmail = contactEmail;
    if (contactPhone !== undefined) org.contactPhone = contactPhone;
    if (website !== undefined) org.website = website;

    const updatedOrg = await org.save();

    res.status(200).json({
      status: 'success',
      message: 'Organization profile updated successfully',
      organization: updatedOrg
    });
  } catch (error) {
    console.error('[Update Org Error]', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to update organization profile'
    });
  }
};
